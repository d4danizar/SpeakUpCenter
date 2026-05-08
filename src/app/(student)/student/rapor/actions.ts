"use server";

import { prisma } from "@/lib/prisma";

/**
 * Mengambil kurikulum lengkap (modul + pertemuan + evaluasi murid)
 * untuk ditampilkan di rapor murid / portal orang tua.
 */
export async function getStudentCurriculum(studentId: string) {
  // 1. Cari programClassId murid
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    select: {
      programClassId: true,
      programClass: { select: { name: true, category: true } },
    },
  });

  if (!enrollment) return null;

  const { programClassId, programClass } = enrollment;

  // 2. Ambil semua modul + pertemuan + evaluasi murid ini
  const modules = await (prisma as any).programModule.findMany({
    where: { programId: programClassId },
    orderBy: { moduleNumber: "asc" },
    include: {
      meetings: {
        orderBy: { meetingNumber: "asc" },
        include: {
          // Rubrik dinamis (multi-aspek JSON)
          // Filter evaluasi hanya untuk murid ini
          meetingEvaluations: {
            where: { studentId },
            select: {
              attendance: true,
              predicate: true,        // Kiddos fallback
              description: true,      // Kiddos: catatan positif
              suggestion: true,       // Kiddos: saran perbaikan
              aspectScores: true,     // Adult Speak: { "Aspek": "A", ... }
              tutorNote: true,        // Adult Speak: catatan umum tutor
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return {
    programClass,
    modules,
  };
}
