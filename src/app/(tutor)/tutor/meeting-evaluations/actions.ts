"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Ambil daftar program yang punya kurikulum modul (untuk filter UI)
export async function getProgramsWithCurriculum() {
  const programs = await (prisma as any).programModule.findMany({
    distinct: ["programId"],
    select: {
      program: { select: { id: true, name: true, category: true } },
    },
  });
  return programs.map((p: any) => p.program);
}

// Ambil modul + pertemuan dari sebuah program (include attendance untuk Box & Lamp)
export async function getModulesWithMeetings(programId: string) {
  const raw = await (prisma as any).programModule.findMany({
    where: { programId },
    include: {
      meetings: {
        orderBy: { meetingNumber: "asc" },
        include: {
          meetingEvaluations: {
            select: {
              studentId: true,
              attendance: true,
              predicate: true,
              aspectScores: true,
            }
          }
        }
      }
    },
    orderBy: { moduleNumber: "asc" },
  });

  // Normalize rubricData to plain JS (Prisma Json fields need explicit serialization)
  return raw.map((mod: any) => ({
    ...mod,
    meetings: mod.meetings.map((meet: any) => ({
      ...meet,
      rubricData: meet.rubricData
        ? JSON.parse(JSON.stringify(meet.rubricData))
        : null,
    })),
  }));
}

// Ambil SEMUA murid aktif di program tertentu dari Global Pool.
export async function getStudentsInProgram(programId: string) {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      enrollments: {
        some: { programClassId: programId },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return students;
}

// Ambil evaluasi existing untuk satu murid + pertemuan tertentu
export async function getExistingEvaluation(studentId: string, meetingId: string) {
  return (prisma as any).meetingEvaluation.findUnique({
    where: { studentId_meetingId: { studentId, meetingId } },
    select: {
      id: true,
      attendance: true,
      predicate: true,
      description: true,
      suggestion: true,
      aspectScores: true,
      tutorNote: true,
    },
  });
}

// Upsert evaluasi — tutor bisa input ulang tanpa duplikasi
export async function upsertMeetingEvaluation(data: {
  studentId: string;
  meetingId: string;
  attendance: string;
  programCategory?: string;                // "ADULT" | "KIDDOS" | dll
  // Kiddos fields
  predicate?: string;
  description?: string;
  suggestion?: string;
  // Adult Speak fields
  aspectScores?: Record<string, string>;   // { "Confidence": "A", ... }
  tutorNote?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sesi tidak valid. Silakan login ulang." };

  const tutorId = session.user.id;
  const PREDICATE_VALID = ["A", "B", "C", "D", "E"];
  const ATTENDANCE_VALID = ["PRESENT", "ABSENT", "SICK", "EXCUSED"];

  if (!ATTENDANCE_VALID.includes(data.attendance)) {
    return { error: "Status kehadiran tidak valid." };
  }
  if (!data.studentId || !data.meetingId) {
    return { error: "Data murid dan pertemuan wajib diisi." };
  }

  const isPresent = data.attendance === "PRESENT";

  // Unified: session extension only for SICK/EXCUSED regardless of program
  const needsExtension =
    data.attendance === "SICK" || data.attendance === "EXCUSED";

  try {
    await prisma.$transaction(async (tx) => {
      // Unified architecture: ALL programs use aspectScores JSON
      const evalData = {
        attendance:   data.attendance,
        tutorId,
        // Legacy single-predicate fields — always null in unified system
        predicate:    null,
        description:  null,
        suggestion:   null,
        // Primary score field for all program types
        aspectScores: isPresent && data.aspectScores && Object.keys(data.aspectScores).length > 0
          ? data.aspectScores
          : null,
        tutorNote: isPresent ? (data.tutorNote?.trim() || null) : null,
      };

      await (tx as any).meetingEvaluation.upsert({
        where: { studentId_meetingId: { studentId: data.studentId, meetingId: data.meetingId } },
        update: evalData,
        create: {
          studentId: data.studentId,
          meetingId: data.meetingId,
          ...evalData,
        },
      });

      // Adult Speak: SICK/EXCUSED → increment sessionExtensions
      // Kiddos: sesi hangus, TIDAK increment
      if (needsExtension) {
        await tx.user.update({
          where: { id: data.studentId },
          data: { sessionExtensions: { increment: 1 } },
        });
      }
    });

    revalidatePath("/tutor");
    revalidatePath("/tutor/dashboard");
    revalidatePath("/tutor/evaluations");
    revalidatePath("/student/rapor");
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    console.error("[upsertMeetingEvaluation]", err);
    return { error: err.message || "Gagal menyimpan evaluasi." };
  }
}

// Hapus evaluasi
export async function deleteMeetingEvaluation(studentId: string, meetingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sesi tidak valid." };

  try {
    await (prisma as any).meetingEvaluation.delete({
      where: { studentId_meetingId: { studentId, meetingId } },
    });
    revalidatePath("/tutor/meeting-evaluations");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus evaluasi." };
  }
}
