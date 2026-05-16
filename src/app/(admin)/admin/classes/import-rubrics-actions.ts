"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

type AspectEntry = {
  aspectName: string;
  A: { desc: string; saran: string };
  B: { desc: string; saran: string };
  C: { desc: string; saran: string };
  D: { desc: string; saran: string };
  E: { desc: string; saran: string };
};

type MeetingData = {
  meetingNumber: number;
  material: string;
  aspects: AspectEntry[];
};

type ModuleData = {
  moduleNumber: number;
  title: string;
  description: string;
  meetings: Map<number, MeetingData>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extracts the first integer from a string or returns the number directly.
 *  "Modul 3" → 3 | "Pertemuan 4" → 4 | 2 → 2 | "2" → 2
 */
function extractNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isInteger(raw) ? raw : Math.round(raw);
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/** Safely coerces to a trimmed string, falling back to empty string. */
function str(raw: unknown): string {
  return String(raw ?? "").trim();
}

// ─── Main Action ──────────────────────────────────────────────────────────────

export async function importRubricsBulk(rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    return { success: false, message: "Data kosong.", errors: [] };
  }

  // ── PHASE 1: Group all rows IN MEMORY ────────────────────────────────────
  // Structure:  programName → moduleNumber → MeetingNumber → MeetingData

  const programMap = new Map<string, Map<number, ModuleData>>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row number (1-indexed header + 1)

    // ── Read identifiers ──
    const programRaw =
      row["Program"] ?? row["program"] ?? row["PROGRAM"];
    const modulRaw =
      row["Modul"] ?? row["modul"] ?? row["MODUL"];
    const pertemuanRaw =
      row["Pertemuan"] ?? row["pertemuan"] ?? row["PERTEMUAN"];

    const programName = str(programRaw);
    const moduleNumber = extractNumber(modulRaw);
    const meetingNumber = extractNumber(pertemuanRaw);

    // Skip row only if ALL three identifiers are missing/zero
    if (!programName || moduleNumber === null || meetingNumber === null) {
      continue;
    }

    // ── Read metadata (use first non-empty value seen for this module/meeting) ──
    const namaModul         = str(row["Nama Modul"]          ?? row["nama modul"]          ?? "");
    const deskripsiModul    = str(row["Deskripsi Modul"]     ?? row["deskripsi modul"]     ?? "");
    const deskripsiPertemuan= str(row["Deskripsi Pertemuan"] ?? row["deskripsi pertemuan"] ?? "");
    const aspectName        = str(row["Aspek"]               ?? row["aspek"]               ?? "");

    // ── Ensure program bucket ──
    if (!programMap.has(programName)) {
      programMap.set(programName, new Map());
    }
    const moduleMap = programMap.get(programName)!;

    // ── Ensure module bucket ──
    if (!moduleMap.has(moduleNumber)) {
      moduleMap.set(moduleNumber, {
        moduleNumber,
        title:       namaModul  || `Modul ${moduleNumber}`,
        description: deskripsiModul,
        meetings:    new Map(),
      });
    }
    const modData = moduleMap.get(moduleNumber)!;

    // First non-empty value wins for module metadata
    if (namaModul       && !modData.title.trim())       modData.title = namaModul;
    if (deskripsiModul  && !modData.description.trim()) modData.description = deskripsiModul;

    // ── Ensure meeting bucket ──
    if (!modData.meetings.has(meetingNumber)) {
      modData.meetings.set(meetingNumber, {
        meetingNumber,
        material: deskripsiPertemuan || `Pertemuan ${meetingNumber}`,
        aspects:  [],
      });
    }
    const meetData = modData.meetings.get(meetingNumber)!;

    // First non-empty deskripsiPertemuan wins
    if (deskripsiPertemuan && meetData.material.startsWith("Pertemuan ")) {
      meetData.material = deskripsiPertemuan;
    }

    // ── Append aspect ONLY if aspectName is present ──
    if (aspectName) {
      meetData.aspects.push({
        aspectName,
        A: { desc: str(row["Desc A"] ?? row["desc a"] ?? ""), saran: str(row["Saran A"] ?? row["saran a"] ?? "") },
        B: { desc: str(row["Desc B"] ?? row["desc b"] ?? ""), saran: str(row["Saran B"] ?? row["saran b"] ?? "") },
        C: { desc: str(row["Desc C"] ?? row["desc c"] ?? ""), saran: str(row["Saran C"] ?? row["saran c"] ?? "") },
        D: { desc: str(row["Desc D"] ?? row["desc d"] ?? ""), saran: str(row["Saran D"] ?? row["saran d"] ?? "") },
        E: { desc: str(row["Desc E"] ?? row["desc e"] ?? ""), saran: str(row["Saran E"] ?? row["saran e"] ?? "") },
      });
    }
  }

  if (programMap.size === 0) {
    return {
      success: false,
      message: "Tidak ada data valid yang bisa diparsing. Pastikan kolom 'Program', 'Modul', dan 'Pertemuan' terisi.",
      errors: [],
    };
  }

  // ── PHASE 2: Persist to Database (Clean-slate per ProgramClass) ───────────

  const errors: string[] = [];
  let totalModules  = 0;
  let totalMeetings = 0;

  for (const [programName, moduleMap] of programMap.entries()) {
    // ── Find ProgramClass ──
    const programClass = await prisma.programClass.findFirst({
      where: { name: { contains: programName, mode: "insensitive" } },
    });

    if (!programClass) {
      errors.push(`Program "${programName}": tidak ditemukan di sistem. Semua modul dalam program ini dilewati.`);
      continue;
    }

    // ── CLEAN SLATE: delete all existing modules for this class ──
    // Cascade will delete ModuleMeeting children automatically (onDelete: Cascade in schema)
    await prisma.programModule.deleteMany({
      where: { programId: programClass.id },
    });

    // ── Create modules in sorted order ──
    const sortedModules = Array.from(moduleMap.values()).sort(
      (a, b) => a.moduleNumber - b.moduleNumber
    );

    for (const modData of sortedModules) {
      try {
        const sortedMeetings = Array.from(modData.meetings.values()).sort(
          (a, b) => a.meetingNumber - b.meetingNumber
        );

        // ── AUTO-INJECT Pertemuan 4 if not already present from Excel ──────
        const hasM4 = sortedMeetings.some((m) => m.meetingNumber === 4);
        if (!hasM4) {
          const m4Material =
            modData.moduleNumber === 6
              ? "PUBLIC SPEAKING COMPETITION"
              : "Perform di Mall";
          sortedMeetings.push({
            meetingNumber: 4,
            material:      m4Material,
            aspects:       [],
          });
          // Re-sort to keep 1, 2, 3, 4 order
          sortedMeetings.sort((a, b) => a.meetingNumber - b.meetingNumber);
        }

        await prisma.programModule.create({
          data: {
            programId:    programClass.id,
            moduleNumber: modData.moduleNumber,
            title:        modData.title || `Modul ${modData.moduleNumber}`,
            description:  modData.description || null,
            isActive:     modData.moduleNumber === 1,
            meetings: {
              create: sortedMeetings.map((meet) => ({
                meetingNumber: meet.meetingNumber,
                material:      meet.material,
                rubricData:    meet.aspects.length > 0 ? meet.aspects : [],
              })),
            },
          },
        });

        totalModules++;
        totalMeetings += sortedMeetings.length;
      } catch (err: any) {
        const errMsg = `Program "${programName}" — Modul ${modData.moduleNumber} "${modData.title}": Gagal disimpan — ${err.message}`;
        console.error(errMsg, err);
        errors.push(errMsg);
      }
    }
  }

  revalidatePath("/admin/classes");

  const successMsg =
    `✅ Import selesai! ${totalModules} modul & ${totalMeetings} pertemuan berhasil dibuat.` +
    (errors.length > 0 ? ` ${errors.length} program/modul gagal.` : "");

  return {
    success: true,
    message: successMsg,
    errors,
  };
}
