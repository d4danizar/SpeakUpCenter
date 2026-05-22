"use server";

import { prisma } from "@/lib/prisma";

export async function getCurriculumForProgram(programId: string) {
  const raw = await (prisma as any).programModule.findMany({
    where: { programId },
    include: {
      meetings: {
        orderBy: { meetingNumber: "asc" },
      }
    },
    orderBy: { moduleNumber: "asc" },
  });

  // Normalize rubricData: Prisma Json fields can be Prisma.JsonValue — force plain JS
  return raw.map((mod: any) => ({
    ...mod,
    meetings: mod.meetings.map((meet: any) => ({
      ...meet,
      rubricData: meet.rubricData
        ? JSON.parse(JSON.stringify(meet.rubricData))
        : null,
    })),
  }));
}

// Dedicated action to fetch rubricData for a single meeting (on-demand, bypasses state caching)
export async function getRubricDataForMeeting(meetingId: string): Promise<any[] | null> {
  if (!meetingId) return null;
  const meeting = await (prisma as any).moduleMeeting.findUnique({
    where: { id: meetingId },
    select: { rubricData: true },
  });
  if (!meeting?.rubricData) return null;
  const parsed = JSON.parse(JSON.stringify(meeting.rubricData));
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed;
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

/** Fetch all active enrolled students for a given ProgramClass (by programId). */
export async function getEnrolledStudentsForProgram(programId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      programClassId: programId,
      student: { status: "ACTIVE" },
    },
    include: {
      student: { select: { id: true, name: true } },
    },
    orderBy: { student: { name: "asc" } },
  });

  // Deduplicate by studentId
  const seen = new Set<string>();
  return enrollments
    .filter((e) => {
      if (seen.has(e.student.id)) return false;
      seen.add(e.student.id);
      return true;
    })
    .map((e) => ({ id: e.student.id, name: e.student.name }));
}
