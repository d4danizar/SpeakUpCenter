"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentProfile(studentId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      leaveQuota: true,
      leaveUsed: true,
      enrollments: {
        include: {
          schedule: {
            include: {
              program: true,
            }
          }
        }
      }
    },
  });
  return profile;
}

export async function getStudentAttendances(studentId: string) {
  const detailedAttendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      session: {
        include: {
          tutor: { select: { name: true } }
        }
      }
    },
    orderBy: {
      session: { date: "desc" }
    }
  });

  return detailedAttendances;
}

export async function getStudentEvaluations(studentId: string) {
  const evaluations = await prisma.evaluation.findMany({
    where: { studentId },
    include: {
      tutor: { select: { name: true } },
      program: { select: { name: true } }
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return evaluations;
}
