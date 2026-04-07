"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentDescriptiveEvaluations(studentId: string) {
  const evaluations = await prisma.evaluation.findMany({
    where: { studentId },
    include: {
      tutor: { select: { name: true } },
      program: { select: { name: true } }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return evaluations;
}
