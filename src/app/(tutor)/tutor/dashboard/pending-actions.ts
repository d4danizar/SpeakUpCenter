"use server";

import { prisma } from "@/lib/prisma";

export type PendingSession = {
  scheduleId: string;
  className: string;      // ClassSchedule.title
  programName: string;    // ProgramClass.name
  programId: string;
  programCategory: string;
  dayOfWeek: string;
  timeSlot: string;
  sessionDate: string;    // ISO date string (e.g. "2026-05-12")
  sessionDateFormatted: string; // Human-readable (e.g. "Senin, 12 Mei 2026")
};

/**
 * Menghitung semua tanggal dalam 30 hari terakhir (tidak termasuk hari ini)
 * yang cocok dengan dayOfWeek dari setiap ClassSchedule.
 */
function getDatesForDayInRange(
  dayOfWeek: string,
  from: Date,
  to: Date
): Date[] {
  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  const target = dayMap[dayOfWeek.toLowerCase()];
  if (target === undefined) return [];

  const results: Date[] = [];
  const cur = new Date(from);
  // Advance to the first occurrence of target day
  while (cur.getDay() !== target) {
    cur.setDate(cur.getDate() + 1);
  }
  while (cur <= to) {
    results.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

function formatDateIndo(date: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Returns all class sessions (derived from ClassSchedule day-of-week) in the
 * last 30 days that were NOT completed (i.e. no Session record with isCompleted=true).
 *
 * We do NOT filter by tutorId — instead we show ALL schedules where:
 *   - the ClassSchedule has at least 1 enrolled student
 *   - the calculated occurrence date falls in the last 30 days (excl. today)
 *   - no Session row exists for that schedule+date OR the existing session has isCompleted=false
 */
export async function getPendingAttendances(): Promise<PendingSession[]> {
  // Range: 30 days ago (start) → yesterday end (strictly BEFORE today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // 1. Fetch all ClassSchedules that have at least 1 enrollment in their ProgramClass
  const schedules = await prisma.classSchedule.findMany({
    include: {
      program: {
        include: {
          enrollments: {
            where: { student: { status: "ACTIVE" } },
            select: { id: true },
          },
        },
      },
      // Fetch all sessions in the last 30 days (excl. today) for this schedule
      sessions: {
        where: {
          date: { gte: thirtyDaysAgo, lte: yesterday },
        },
        select: {
          id: true,
          date: true,
          isCompleted: true,
        },
      },
    },
  });

  const pending: PendingSession[] = [];

  for (const sch of schedules) {
    // Skip schedules with no active students
    if (sch.program.enrollments.length === 0) continue;

    // Determine all occurrence dates for this dayOfWeek in range [30 days ago, yesterday]
    const occurrences = getDatesForDayInRange(sch.dayOfWeek, thirtyDaysAgo, yesterday);

    for (const occDate of occurrences) {
      const dayStart = new Date(occDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(occDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find if there's already a session for this schedule on this date
      const existingSession = sch.sessions.find(
        (s) => s.date >= dayStart && s.date <= dayEnd
      );

      // Pending if: no session at all, OR session exists but isCompleted=false
      const isPending = !existingSession || !existingSession.isCompleted;

      if (isPending) {
        pending.push({
          scheduleId: sch.id,
          className: sch.title,
          programName: sch.program.name,
          programId: sch.program.id,
          programCategory: sch.program.category,
          dayOfWeek: sch.dayOfWeek,
          timeSlot: `${sch.startTime} - ${sch.endTime}`,
          sessionDate: occDate.toISOString().split("T")[0],
          sessionDateFormatted: formatDateIndo(occDate),
        });
      }
    }
  }

  // Sort by date descending (most recent first)
  pending.sort(
    (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  );

  return pending;
}
