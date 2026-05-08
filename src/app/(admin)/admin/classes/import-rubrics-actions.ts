"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importRubricsBulk(rows: any[]) {
  if (!rows || rows.length === 0) {
    return { success: false, message: "Data kosong." };
  }

  // 1. Group rows by Program + Modul + Pertemuan.
  //    BUG FIX: Baris yang tidak memiliki Aspek TETAP harus membuat entri pertemuan.
  //    Hanya 3 kolom identitas (Program, Modul, Pertemuan) yang wajib ada.
  const groups: Record<string, {
    programName: string;
    moduleName: string;
    meetingNumberRaw: any;
    namaModul: string;
    deskripsiModul: string;
    deskripsiPertemuan: string;
    aspects: any[];
  }> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const programName      = row["Program"]    || row["program"];
    const moduleName       = row["Modul"]      || row["modul"];
    const meetingNumberRaw = row["Pertemuan"]  || row["pertemuan"];

    // Hanya skip jika 3 kolom identitas utama kosong
    if (!programName || !moduleName || !meetingNumberRaw) continue;

    const namaModul          = String(row["Nama Modul"]          || row["nama modul"]          || "").trim();
    const deskripsiModul     = String(row["Deskripsi Modul"]     || row["deskripsi modul"]     || "").trim();
    const deskripsiPertemuan = String(row["Deskripsi Pertemuan"] || row["deskripsi pertemuan"] || "").trim();
    const aspectName         = String(row["Aspek"]               || row["aspek"]               || "").trim();

    const key = `${programName}_${moduleName}_${meetingNumberRaw}`.toLowerCase();

    if (!groups[key]) {
      groups[key] = {
        programName,
        moduleName,
        meetingNumberRaw,
        namaModul,
        deskripsiModul,
        deskripsiPertemuan,
        aspects: [],
      };
    }

    // Tambahkan aspek ke grup HANYA jika nama aspek tidak kosong
    if (aspectName) {
      groups[key].aspects.push({
        aspectName,
        A: { desc: row["Desc A"]  || row["desc a"]  || "", saran: row["Saran A"] || row["saran a"] || "" },
        B: { desc: row["Desc B"]  || row["desc b"]  || "", saran: row["Saran B"] || row["saran b"] || "" },
        C: { desc: row["Desc C"]  || row["desc c"]  || "", saran: row["Saran C"] || row["saran c"] || "" },
        D: { desc: row["Desc D"]  || row["desc d"]  || "", saran: row["Saran D"] || row["saran d"] || "" },
        E: { desc: row["Desc E"]  || row["desc e"]  || "", saran: row["Saran E"] || row["saran e"] || "" },
      });
    }
  }

  let successCount = 0;
  let errorCount   = 0;
  const errors: string[] = [];

  for (const key in groups) {
    const group = groups[key];
    try {
      // Extract module number dari string seperti "Modul 1" atau angka "1"
      let moduleNumber = 1;
      let mName = group.moduleName;
      if (typeof mName === "string" && mName.toLowerCase().includes("modul")) {
        const match = mName.match(/\d+/);
        if (match) moduleNumber = parseInt(match[0]);
      } else if (typeof mName === "number") {
        moduleNumber = mName;
        mName = `Modul ${moduleNumber}`;
      }

      // Extract meeting number dari string "Pertemuan 1" atau angka "1"
      let meetingNumber = 1;
      const meetRaw = group.meetingNumberRaw;
      if (typeof meetRaw === "string") {
        const match = meetRaw.match(/\d+/);
        if (match) meetingNumber = parseInt(match[0]);
      } else if (typeof meetRaw === "number") {
        meetingNumber = meetRaw;
      }

      // 1. Cari ProgramClass berdasarkan nama (case-insensitive)
      const program = await prisma.programClass.findFirst({
        where: { name: { contains: String(group.programName).trim(), mode: "insensitive" } },
      });

      if (!program) {
        errors.push(`Grup [${group.programName} — ${mName} — Pertemuan ${meetingNumber}]: Program tidak ditemukan di sistem.`);
        errorCount++;
        continue;
      }

      // 2. Find or Create ProgramModule — update title/description jika Excel mengisi nilai
      let module = await prisma.programModule.findFirst({
        where: { programId: program.id, moduleNumber },
      });

      if (!module) {
        module = await prisma.programModule.create({
          data: {
            programId:    program.id,
            moduleNumber,
            title:        group.namaModul || String(mName).trim(),
            description:  group.deskripsiModul || null,
            isActive:     moduleNumber === 1,
          },
        });
      } else {
        const moduleUpdates: any = {};
        if (group.namaModul)      moduleUpdates.title       = group.namaModul;
        if (group.deskripsiModul) moduleUpdates.description = group.deskripsiModul;
        if (Object.keys(moduleUpdates).length > 0) {
          module = await prisma.programModule.update({
            where: { id: module.id },
            data:  moduleUpdates,
          });
        }
      }

      // 3. Find or Create ModuleMeeting — SELALU upsert, bahkan jika tidak ada aspek
      const existingMeeting = await prisma.moduleMeeting.findFirst({
        where: { moduleId: module.id, meetingNumber },
      });

      // Hanya simpan rubricData jika ada aspek; jika tidak, jangan timpa data lama dengan null
      const rubricPayload = group.aspects.length > 0 ? group.aspects : undefined;

      if (existingMeeting) {
        const meetingUpdates: any = {};
        if (group.deskripsiPertemuan) meetingUpdates.material   = group.deskripsiPertemuan;
        if (rubricPayload !== undefined) meetingUpdates.rubricData = rubricPayload;

        if (Object.keys(meetingUpdates).length > 0) {
          await prisma.moduleMeeting.update({
            where: { id: existingMeeting.id },
            data:  meetingUpdates,
          });
        }
      } else {
        await prisma.moduleMeeting.create({
          data: {
            moduleId:     module.id,
            meetingNumber,
            material:     group.deskripsiPertemuan || `Materi Pertemuan ${meetingNumber}`,
            rubricData:   rubricPayload ?? null,
          },
        });
      }

      successCount++;
    } catch (err: any) {
      console.error(`Error on group ${key}:`, err);
      errors.push(`Grup [${key}]: Terjadi kesalahan internal — ${err.message}.`);
      errorCount++;
    }
  }

  revalidatePath("/admin/classes");
  return {
    success: true,
    message: `Selesai! ${successCount} pertemuan berhasil diproses. ${errorCount} grup gagal.`,
    errors,
  };
}
