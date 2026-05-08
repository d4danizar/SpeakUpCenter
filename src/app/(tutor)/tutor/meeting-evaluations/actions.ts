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
  return (prisma as any).programModule.findMany({
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
              aspectScores: true, // Dibutuhkan oleh MeetingLampGrid untuk hasScore
            }
          }
        }
      }
    },
    orderBy: { moduleNumber: "asc" },
  });
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

  const isPresent    = data.attendance === "PRESENT";
  const isAdultSpeak = data.programCategory === "ADULT";
  const isKiddos     = !isAdultSpeak;

  // Validasi server hanya untuk attendance valid dan field wajib.
  // Validasi kelengkapan nilai (predicate/aspectScores) dilakukan di client
  // agar alur Defer (Isi Nanti) bisa menyimpan PRESENT tanpa score.
  if (data.predicate && !["A", "B", "C", "D", "E"].includes(data.predicate)) {
    return { error: "Predikat tidak valid." };
  }


  const needsExtension =
    isAdultSpeak && (data.attendance === "SICK" || data.attendance === "EXCUSED");

  try {
    await prisma.$transaction(async (tx) => {
      const evalData = {
        attendance: data.attendance,
        tutorId,
        // Kiddos
        predicate:   isPresent && isKiddos    ? (data.predicate  || null) : null,
        description: isPresent && isKiddos    ? (data.description?.trim() || null) : null,
        suggestion:  isPresent && isKiddos    ? (data.suggestion?.trim()  || null) : null,
        // Adult Speak
        aspectScores: isPresent && isAdultSpeak ? (data.aspectScores ?? null) : null,
        tutorNote:    isPresent && isAdultSpeak ? (data.tutorNote?.trim()   || null) : null,
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

    revalidatePath("/tutor/meeting-evaluations");
    revalidatePath("/student/dashboard");
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
