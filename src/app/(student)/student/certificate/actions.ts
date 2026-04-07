"use server";

import { prisma } from "../../../../lib/prisma";

export async function generateCertificateData(studentId: string) {
  // 1. Fetch Student Data
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // 2. Fetch enrollment to get program & date info (replacing legacy activeProgram, startDate, endDate)
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id },
    select: {
      startDate: true,
      schedule: {
        select: {
          program: { select: { name: true } }
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  const activeProgramName = enrollment?.schedule?.program?.name || null;
  const startDate = enrollment?.startDate || null;
  // endDate tidak ada di schema baru — gunakan null (ada fitur sertifikat ke depan)
  const endDate: Date | null = null;

  // Determine eligibility (tanpa endDate, siswa belum eligible untuk sertifikat)
  const isEligible = false;

  // 3. Calculate Final Score from Evaluation model
  const evaluations = await prisma.evaluation.findMany({
    where: { studentId: student.id },
    select: {
      metrics: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  let sumFluency = 0;
  let sumPronunciation = 0;
  let sumVocabulary = 0;
  let validEvaluationCount = 0;

  evaluations.forEach((ev) => {
    const metrics = ev.metrics as any;
    if (!metrics) return;

    const fluency = Number(metrics.fluency || metrics.Fluency || 0);
    const pronunciation = Number(metrics.pronunciation || metrics.Pronunciation || 0);
    const vocabulary = Number(metrics.vocabulary || metrics.Vocabulary || 0);

    if (fluency > 0 || pronunciation > 0 || vocabulary > 0) {
      sumFluency += fluency;
      sumPronunciation += pronunciation;
      sumVocabulary += vocabulary;
      validEvaluationCount++;
    }
  });

  let avgFluency = 0;
  let avgPronunciation = 0;
  let avgVocab = 0;
  let overallScore = 0;
  let predicate = "E";

  if (validEvaluationCount > 0) {
    avgFluency = sumFluency / validEvaluationCount;
    avgPronunciation = sumPronunciation / validEvaluationCount;
    avgVocab = sumVocabulary / validEvaluationCount;
    overallScore = (avgFluency + avgPronunciation + avgVocab) / 3;

    if (overallScore >= 9.0) predicate = "A";
    else if (overallScore >= 8.0) predicate = "B";
    else if (overallScore >= 7.0) predicate = "C";
    else if (overallScore >= 6.0) predicate = "D";
    else predicate = "E";
  }

  return {
    student: {
      name: student.name,
      activeProgram: activeProgramName,
      startDate: startDate,
      endDate: endDate,
    },
    scores: {
      fluency: Number(avgFluency.toFixed(1)),
      pronunciation: Number(avgPronunciation.toFixed(1)),
      vocabulary: Number(avgVocab.toFixed(1)),
      overall: Number(overallScore.toFixed(1)),
      predicate: predicate,
    },
    isEligible,
  };
}