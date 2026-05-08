"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { parseIndonesianDate } from "@/lib/date-parser";

// ─── Tipe hasil import ────────────────────────────────────────────────────────
export type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
  enrolled: number;   // Berhasil di-enroll ke program
  errors: string[];
};

export type ProgramOption = {
  id: string;
  name: string;
  category: string;
  branch: string;
  scheduleCount: number; // Jumlah jadwal yang tersedia untuk dipilih
};

// ─── Get daftar program yang bisa dijadikan tujuan import ────────────────────
export async function getAvailablePrograms(): Promise<ProgramOption[]> {
  const programs = await prisma.programClass.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      branch: true,
      schedules: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return programs.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    branch: p.branch,
    scheduleCount: p.schedules.length,
  }));
}

// ─── Sanitasi nomor telepon ───────────────────────────────────────────────────
function sanitizePhone(raw: string | number | null | undefined): string {
  if (!raw) return "";
  let str = String(raw).trim();

  // Tangani multi-number (dipisah "/" atau ",") → ambil yang pertama saja
  if (str.includes("/")) str = str.split("/")[0].trim();
  if (str.includes(",")) str = str.split(",")[0].trim();

  let digits = str.replace(/\D/g, "");

  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;

  if (digits.length < 9 || digits.length > 15) return "";
  return digits;
}

// ─── Generate email unik dari nama + phone ────────────────────────────────────
function generateEmail(name: string, phone: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  const suffix = phone.slice(-4);
  return `${slug}_${suffix}@student.speakup.com`;
}

// ─── Main Action ──────────────────────────────────────────────────────────────
export async function importStudentsBulk(
  studentsData: any[],
  targetProgramId?: string   // Opsional: assign ke ProgramClass ini
): Promise<ImportResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { total: 0, imported: 0, skipped: 0, enrolled: 0, errors: ["Sesi tidak valid."] };
  }

  const result: ImportResult = {
    total: studentsData.length,
    imported: 0,
    skipped: 0,
    enrolled: 0,
    errors: [],
  };

  // ── Resolusi preferredSchedule (opsional, untuk homebase murid di dashboard) ──
  let preferredScheduleId: string | null = null;
  if (targetProgramId) {
    const firstSchedule = await prisma.classSchedule.findFirst({
      where: { programId: targetProgramId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    preferredScheduleId = firstSchedule?.id ?? null;
  }

  for (let i = 0; i < studentsData.length; i++) {
    const row = studentsData[i];
    const rowNum = i + 2;

    try {
      // ── Ekstrak data ──
      const name = String(row["Nama"] ?? row["nama"] ?? "").trim();
      const rawPhone = row["Nomor WhatsApp"] ?? row["No. WhatsApp"] ?? row["Phone"] ?? row["Telepon"] ?? "";
      const rawStart = row["Tanggal Mulai"] ?? row["Mulai"] ?? "";
      const rawEnd = row["Tanggal Selesai"] ?? row["Selesai"] ?? row["Tanggal Berakhir"] ?? "";
      const scheduleChoice = String(row["Pilihan Jadwal"] ?? row["Jadwal"] ?? "").trim();
      const statusRaw = String(row["Status"] ?? row["status"] ?? "Aktif").trim();

      if (!name) {
        result.skipped++;
        result.errors.push(`Baris ${rowNum}: Nama kosong — dilewati.`);
        continue;
      }

      const cleanPhone = sanitizePhone(rawPhone);
      if (!cleanPhone) {
        result.skipped++;
        result.errors.push(`Baris ${rowNum}: "${name}" — nomor WhatsApp tidak valid ("${rawPhone}") — dilewati.`);
        continue;
      }

      const startDate = parseIndonesianDate(rawStart);
      const endDate = parseIndonesianDate(rawEnd);
      const hashedPassword = await bcrypt.hash(cleanPhone, 10);
      const email = generateEmail(name, cleanPhone);

      // ── Upsert user ──
      const upsertedUser = await (prisma as any).user.upsert({
        where: { email },
        update: {
          name,
          phoneNumber: cleanPhone,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(scheduleChoice && { scheduleChoice }),
          studentStatus: statusRaw || "Aktif",
        },
        create: {
          name,
          email,
          passwordHash: hashedPassword,
          phoneNumber: cleanPhone,
          role: "STUDENT",
          status: "ACTIVE",
          studentStatus: statusRaw || "Aktif",
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(scheduleChoice && { scheduleChoice }),
        },
        select: { id: true },
      });

      result.imported++;

      // ── Enrollment ke ProgramClass (Global Pool) ──
      if (targetProgramId && upsertedUser?.id) {
        const enrollStart = startDate ?? new Date();

        // Cek duplikasi enrollment di program yang sama
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: { studentId: upsertedUser.id, programClassId: targetProgramId },
          select: { id: true },
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              studentId: upsertedUser.id,
              programClassId: targetProgramId,
              preferredScheduleId: preferredScheduleId ?? undefined,
              startDate: enrollStart,
              currentModule: 1,
              frozenPrice: 0,
            },
          });
          result.enrolled++;
        }
      }
    } catch (err: any) {
      result.errors.push(`Baris ${rowNum}: Error — ${err.message}`);
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");
  return result;
}
