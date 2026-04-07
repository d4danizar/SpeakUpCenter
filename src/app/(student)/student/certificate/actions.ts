"use server";

import { prisma } from "../../../../lib/prisma";

export async function generateCertificateData(studentId: string) {
  // 1. Fetch Student Data
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      activeProgram: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Determine eligibility (has the program ended?)
  // We check if endDate is in the past compared to today.
  // If no endDate, we assume NOT eligible.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isEligible = false;
  let finalScore = 0;

  if (student.endDate) {
    const end = new Date(student.endDate);
    end.setHours(0, 0, 0, 0);
    isEligible = today > end;
  }

  // 2. Calculate Final Score IF eligible (or just calculate anyway)
  // KITA HAPUS filter tanggal Prisma yang kaku agar tidak bentrok dengan Timezone
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId: student.id, // Pastikan ini sesuai schema (atau ganti userId jika schema pakai userId)
      status: "PRESENT",
    },
    include: {
      session: {
        select: { date: true, programType: true }
      }
    }
  });

  let sumFluency = 0;
  let sumPronunciation = 0;
  let sumVocabulary = 0;
  let validEvaluationCount = 0;

  attendances.forEach((att) => {
    const sessionTime = new Date(att.session.date).getTime();
    const startTime = student.startDate ? new Date(student.startDate).getTime() : 0;
    const endTime = student.endDate
      ? new Date(student.endDate).setHours(23, 59, 59, 999)
      : Infinity;

    const isWithinActivePeriod = sessionTime >= startTime && sessionTime <= endTime;

    const hasScores = (att.fluency && att.fluency > 0) ||
      (att.pronunciation && att.pronunciation > 0) ||
      (att.vocabulary && att.vocabulary > 0);

    if (hasScores && isWithinActivePeriod) {
      // Jumlahkan semua nilai per kategori
      sumFluency += att.fluency || 0;
      sumPronunciation += att.pronunciation || 0;
      sumVocabulary += att.vocabulary || 0;
      validEvaluationCount++;
    }
  });

  // Siapkan variabel nilai akhir
  let avgFluency = 0;
  let avgPronunciation = 0;
  let avgVocab = 0;
  let overallScore = 0;
  let predicate = "E";

  if (validEvaluationCount > 0) {
    // Hitung rata-rata per kategori
    avgFluency = sumFluency / validEvaluationCount;
    avgPronunciation = sumPronunciation / validEvaluationCount;
    avgVocab = sumVocabulary / validEvaluationCount;

    // Hitung rata-rata keseluruhan (Overall Score)
    overallScore = (avgFluency + avgPronunciation + avgVocab) / 3;

    // Tentukan Predikat (A-E)
    if (overallScore >= 9.0) predicate = "A";
    else if (overallScore >= 8.0) predicate = "B";
    else if (overallScore >= 7.0) predicate = "C";
    else if (overallScore >= 6.0) predicate = "D";
    else predicate = "E";
  }

  // Return data dengan format baru
  return {
    student: {
      name: student.name,
      activeProgram: student.activeProgram,
      startDate: student.startDate,
      endDate: student.endDate,
    },
    scores: {
      fluency: Number(avgFluency.toFixed(1)), // Dibulatkan 1 angka di belakang koma (misal: 8.5)
      pronunciation: Number(avgPronunciation.toFixed(1)),
      vocabulary: Number(avgVocab.toFixed(1)),
      overall: Number(overallScore.toFixed(1)),
      predicate: predicate,
    },
    isEligible,
  };
}