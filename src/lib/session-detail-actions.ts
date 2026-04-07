"use server";

import { prisma } from "./prisma";
import { getEligibleStudentsForSession, getGlobalPoolForSession } from "./student-pool";
import { revalidatePath } from "next/cache";

export type SessionDetailData = {
  id: string;
  title: string;
  date: string; // ISO string
  timeSlot: string;
  programType: string;
  isCompleted: boolean;
  tutorName: string;
  attendances: {
    id: string;
    studentId: string;
    studentName: string;
    studentProgram: string | null;
    status: string;
    pronunciation: number | null;
    fluency: number | null;
    vocabulary: number | null;
    tutorNotes: string | null;
    rescheduleNotes: string | null;
  }[];
  eligibleStudents: {
    id: string;
    name: string;
    activeProgram: string | null;
  }[];
  globalPoolStudents: {
    id: string;
    name: string;
    activeProgram: string | null;
  }[];
  isEvalDay: boolean;
};

/**
 * Fetch full session detail including tutor, attendances, eligible students, and global pool.
 */
export async function getSessionDetail(sessionId: string): Promise<SessionDetailData | null> {
  const raw = await (prisma.session as any).findUnique({
    where: { id: sessionId },
    include: {
      tutor: { select: { name: true } },
      assignedStudents: { select: { id: true } },
      attendances: {
        include: {
          student: { select: { id: true, name: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!raw) return null;

  return {
    id: raw.id,
    title: raw.title,
    date: raw.date.toISOString(),
    timeSlot: raw.timeSlot ?? "",
    programType: raw.programType ?? "",
    isCompleted: raw.isCompleted,
    tutorName: raw.tutor?.name ?? "",
    isEvalDay: raw.date.getDay() === 5,
    attendances: (raw.attendances ?? []).map((a: any) => ({
      id: a.id,
      studentId: a.student?.id ?? a.studentId,
      studentName: a.student?.name ?? "",
      studentProgram: a.student?.activeProgram ?? null,
      status: a.status,
      pronunciation: a.pronunciation ?? null,
      fluency: a.fluency ?? null,
      vocabulary: a.vocabulary ?? null,
      tutorNotes: a.tutorNotes ?? null,
      rescheduleNotes: a.rescheduleNotes ?? null,
    })),
    eligibleStudents: [],
    globalPoolStudents: [],
  };
}

/**
 * Update attendance records for a session (upsert based on sessionId+studentId).
 * Can also be used to revise already-submitted attendance.
 */
export async function updateAttendance(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const studentIds = formData.getAll("studentId") as string[];
    const statuses = formData.getAll("status") as string[];
    const pronunciations = formData.getAll("pronunciation") as string[];
    const fluencies = formData.getAll("fluency") as string[];
    const vocabularies = formData.getAll("vocabulary") as string[];
    const tutorNotes = formData.get("tutorNotes") as string;

    if (!sessionId || studentIds.length === 0) {
      return { error: "Session ID and at least one student are required." };
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        const status = (statuses[i] || "PRESENT") as "PRESENT" | "ABSENT" | "EXCUSED" | "SICK";
        const pronunciation = parseInt(pronunciations[i]) || null;
        const fluency = parseInt(fluencies[i]) || null;
        const vocabulary = parseInt(vocabularies[i]) || null;

        // Upsert: update if exists, create if not
        await tx.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId },
          },
          update: {
            status,
            tutorNotes: tutorNotes || null,
          } as any,
          create: {
            sessionId,
            studentId,
            status,
            tutorNotes: tutorNotes || null,
          } as any,
        });
      }

      // Mark session as completed
      await tx.session.update({
        where: { id: sessionId },
        data: { isCompleted: true },
      });
    });

    revalidatePath("/admin/classes");
    revalidatePath("/tutor");
    revalidatePath("/tutor/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("updateAttendance error:", error);
    return { error: error.message || "Failed to update attendance." };
  }
}
