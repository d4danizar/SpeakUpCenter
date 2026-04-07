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
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      tutor: { select: { name: true } },
      assignedStudents: { select: { id: true } },
      attendances: {
        include: {
          student: { select: { id: true, name: true, activeProgram: true } },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!session) return null;

  const sessionDay = session.date.getDay();
  const isEvalDay =
    sessionDay === 5 || // Friday
    (sessionDay === 6 && session.programType === "English on Saturday"); // Saturday for specific program

  // Get eligible students (strict radar)
  const eligibleStudents = await getEligibleStudentsForSession({
    date: session.date,
    timeSlot: session.timeSlot,
    programType: session.programType,
    assignedStudents: session.assignedStudents,
  });

  // Get global pool for manual add (broad)
  const globalPoolStudents = await getGlobalPoolForSession({
    programType: session.programType,
    timeSlot: session.timeSlot
  });

  // Build attendance IDs set for exclusion from global pool
  const attendedIds = new Set(session.attendances.map((a) => a.studentId));
  const eligibleIds = new Set(eligibleStudents.map((s) => s.id));

  return {
    id: session.id,
    title: session.title,
    date: session.date.toISOString(),
    timeSlot: session.timeSlot,
    programType: session.programType,
    isCompleted: session.isCompleted,
    tutorName: session.tutor.name,
    isEvalDay,
    attendances: session.attendances.map((a) => ({
      id: a.id,
      studentId: a.student.id,
      studentName: a.student.name,
      studentProgram: a.student.activeProgram,
      status: a.status,
      pronunciation: a.pronunciation,
      fluency: a.fluency,
      vocabulary: a.vocabulary,
      tutorNotes: a.tutorNotes,
      rescheduleNotes: a.rescheduleNotes,
    })),
    eligibleStudents,
    globalPoolStudents: globalPoolStudents.filter(
      (s) => !attendedIds.has(s.id) && !eligibleIds.has(s.id)
    ),
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
            pronunciation,
            fluency,
            vocabulary,
            tutorNotes: tutorNotes || null,
          },
          create: {
            sessionId,
            studentId,
            status,
            pronunciation,
            fluency,
            vocabulary,
            tutorNotes: tutorNotes || null,
          },
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
