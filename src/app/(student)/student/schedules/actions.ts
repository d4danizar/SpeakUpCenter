"use server";

import { prisma } from "../../../../lib/prisma";

export async function getStudentUpcomingSchedules(studentId: string) {
  // Ambil enrollment murid untuk mendapatkan programClassId
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    select: {
      programClassId: true,
      preferredSchedule: {
        select: { id: true, title: true, dayOfWeek: true, startTime: true, endTime: true, room: true }
      }
    }
  });

  if (!enrollment) return [];

  // Ambil semua jadwal dari program murid ini
  const schedules = await prisma.classSchedule.findMany({
    where: { programId: enrollment.programClassId },
    include: {
      program: { select: { name: true } },
      tutor: { select: { name: true } }
    }
  });

  return schedules;
}
