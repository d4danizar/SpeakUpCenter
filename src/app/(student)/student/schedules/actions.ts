"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentUpcomingSchedules(studentId: string) {
  const schedules = await prisma.classSchedule.findMany({
    where: {
      enrollments: {
        some: { studentId: studentId }
      }
    },
    include: {
      program: { select: { name: true } },
      tutor: { select: { name: true } }
    }
  });

  return schedules;
}
