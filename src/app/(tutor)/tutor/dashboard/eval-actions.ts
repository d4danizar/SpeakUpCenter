"use server";

import { prisma } from "@/lib/prisma";

export async function getCurriculumForProgram(programId: string) {
  return (prisma as any).programModule.findMany({
    where: { programId },
    include: {
      meetings: {
        orderBy: { meetingNumber: "asc" },
      }
    },
    orderBy: { moduleNumber: "asc" },
  });
}

export async function getEvaluationsForStudents(studentIds: string[], meetingId: string) {
  if (studentIds.length === 0 || !meetingId) return [];
  
  return (prisma as any).meetingEvaluation.findMany({
    where: {
      studentId: { in: studentIds },
      meetingId: meetingId
    },
    select: {
      id: true,
      studentId: true,
      attendance: true,
      predicate: true,
      description: true,
      suggestion: true,
      aspectScores: true,
      tutorNote: true,
    }
  });
}

export async function getPresentStudents(sessionId: string) {
  if (!sessionId) return [];

  const presentAttendances = await prisma.attendance.findMany({
    where: {
      sessionId: sessionId,
      status: "PRESENT",
    },
    include: {
      student: {
        select: { id: true, name: true }
      }
    }
  });

  return presentAttendances.map(a => ({
    id: a.student.id,
    name: a.student.name,
    existingStatus: "PRESENT"
  }));
}
