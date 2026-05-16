"use server";

import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Legacy (preserved for backward compat) ───────────────────────────────────
export async function getProgramsForFilter() {
  return prisma.programClass.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Dedicated: fetch rubricData fresh from DB for a single meeting ───────────
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

// ─── NEW: Semua kelas beserta modul & pertemuan ───────────────────────────────
export async function getClassesWithModules() {
  const raw = await (prisma as any).programClass.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      modules: {
        orderBy: { moduleNumber: "asc" },
        select: {
          id: true,
          moduleNumber: true,
          title: true,
          meetings: {
            orderBy: { meetingNumber: "asc" },
            select: {
              id: true,
              meetingNumber: true,
              material: true,
              isPerformance: true,
              rubricData: true,
            },
          },
        },
      },
    },
  });

  // Normalize Prisma Json fields to plain JS so they cross Server Action boundary correctly
  return raw.map((cls: any) => ({
    ...cls,
    modules: cls.modules.map((mod: any) => ({
      ...mod,
      meetings: mod.meetings.map((meet: any) => ({
        ...meet,
        rubricData: meet.rubricData
          ? JSON.parse(JSON.stringify(meet.rubricData))
          : null,
      })),
    })),
  }));
}

// ─── NEW: Data satu pertemuan + seluruh murid enrolled + evaluasi existing ────
export async function getMeetingStudentEvals(meetingId: string, programClassId: string) {
  // Ambil semua murid yang terdaftar di kelas ini
  const enrollments = await prisma.enrollment.findMany({
    where: {
      programClassId,
      student: { role: "STUDENT", status: "ACTIVE" },
    },
    select: {
      student: { select: { id: true, name: true } },
    },
  });

  const students = Array.from(
    new Map(enrollments.map((e) => [e.student.id, e.student])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Ambil evaluasi existing untuk pertemuan ini
  const evals = await (prisma as any).meetingEvaluation.findMany({
    where: { meetingId },
    select: {
      id: true,
      studentId: true,
      attendance: true,
      predicate: true,
      description: true,
      suggestion: true,
      aspectScores: true,
      tutorNote: true,
    },
  });

  const evalMap = new Map(evals.map((e: any) => [e.studentId, e]));

  return students.map((s) => ({
    ...s,
    eval: (evalMap.get(s.id) as any) ?? null,
  }));
}

// ─── NEW: Admin upsert MeetingEvaluation (sama dengan tutor, tanpa session-role check) ──
export async function adminUpsertMeetingEval(data: {
  studentId: string;
  meetingId: string;
  attendance: string;
  programCategory?: string;
  predicate?: string;
  description?: string;
  suggestion?: string;
  aspectScores?: Record<string, string>;
  tutorNote?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Sesi tidak valid." };

  const tutorId = session.user.id;
  const ATTENDANCE_VALID = ["PRESENT", "ABSENT", "SICK", "EXCUSED"];
  if (!ATTENDANCE_VALID.includes(data.attendance)) {
    return { success: false, error: "Status kehadiran tidak valid." };
  }

  const isPresent = data.attendance === "PRESENT";

  try {
    const evalData = {
      attendance:   data.attendance,
      tutorId,
      // Unified: legacy fields always null
      predicate:    null,
      description:  null,
      suggestion:   null,
      // All programs use aspectScores JSON
      aspectScores: isPresent && data.aspectScores && Object.keys(data.aspectScores).length > 0
        ? data.aspectScores : null,
      tutorNote: isPresent ? (data.tutorNote?.trim() || null) : null,
    };

    await (prisma as any).meetingEvaluation.upsert({
      where: { studentId_meetingId: { studentId: data.studentId, meetingId: data.meetingId } },
      update: evalData,
      create: { studentId: data.studentId, meetingId: data.meetingId, ...evalData },
    });

    revalidatePath("/tutor/evaluations");
    revalidatePath("/student/rapor");
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    console.error("[adminUpsertMeetingEval]", err);
    return { success: false, error: err.message || "Gagal menyimpan evaluasi." };
  }
}

// ─── Legacy: kept for backward compat ────────────────────────────────────────
export async function getStudentsByProgram(programId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { programClassId: programId, student: { role: "STUDENT", status: "ACTIVE" } },
    select: { student: { select: { id: true, name: true, evaluationsReceived: { where: { programId }, orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
  const studentMap = new Map();
  for (const e of enrollments) {
    if (!studentMap.has(e.student.id)) studentMap.set(e.student.id, e.student);
  }
  return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function submitAdHocEvaluation(
  programId: string, studentId: string, tutorId: string,
  moduleName: string, sessionType: string, notes: string, metricsStr: string
) {
  try {
    const metrics = JSON.parse(metricsStr);
    await prisma.evaluation.create({ data: { programId, studentId, tutorId, moduleName, sessionType, metrics, notes: notes || null } });
    revalidatePath("/tutor/evaluations");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to submit evaluation." };
  }
}
