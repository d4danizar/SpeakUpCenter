"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

const STAFF_ALLOWED = ["SUPER_ADMIN", "MANAGER", "CS"];

export async function assignStudentToSession(userId: string, sessionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    await (prisma as any).user.update({
      where: { id: userId },
      data: { sessionId },
    });
    
    revalidatePath("/admin/academic/pool");
    return { success: true };
  } catch (err: any) {
    console.error("[assignStudentToSession]", err);
    return { error: "Gagal mengatur alokasi kelas." };
  }
}

export async function assignStudentsToClassGroup(userIds: string[], classGroupId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    await (prisma as any).user.updateMany({
      where: { id: { in: userIds } },
      data: { classGroupId },
    });
    
    revalidatePath("/admin/academic/pool");
    return { success: true };
  } catch (err: any) {
    console.error("[assignStudentsToClassGroup]", err);
    return { error: "Gagal mendaftarkan siswa secara massal ke Rombel." };
  }
}

export async function getSessionAttendance(sessionId: string) {
  try {
    const sessionDoc = await (prisma as any).session.findUnique({
      where: { id: sessionId },
      include: { classGroup: true }
    });

    if (!sessionDoc) return { error: "Sesi tidak ditemukan" };

    // 1. Regular students
    let regularStudents: any[] = [];
    if (sessionDoc.classGroupId) {
      regularStudents = await (prisma as any).user.findMany({
        where: { classGroupId: sessionDoc.classGroupId, role: "STUDENT" },
        select: { id: true, name: true, activeProgram: true, phoneNumber: true }
      });
    }

    // 2. Sit-in students (Guests)
    const sitInRecords = await (prisma as any).attendance.findMany({
      where: { sessionId, isGuest: true },
      include: { student: { select: { id: true, name: true, activeProgram: true, phoneNumber: true } } }
    });

    const sitInStudents = sitInRecords.map((r: any) => ({ ...r.student, isGuest: true }));

    return { 
      success: true, 
      session: sessionDoc,
      regularStudents,
      sitInStudents,
      allParticipants: [...regularStudents, ...sitInStudents]
    };
  } catch (err) {
    console.error("[getSessionAttendance]", err);
    return { error: "Gagal menarik data peserta" };
  }
}

export async function searchGuestStudents(program: string, currentSessionId: string) {
  try {
    const sessionDoc = await (prisma as any).session.findUnique({
      where: { id: currentSessionId }
    });

    const students = await (prisma as any).user.findMany({
      where: {
        role: "STUDENT",
        activeProgram: program,
        OR: [
          { classGroupId: null },
          { classGroupId: { not: sessionDoc?.classGroupId || "" } }
        ]
      },
      select: { id: true, name: true, classGroup: { select: { name: true } } }
    });

    return { success: true, students };
  } catch (err) {
    console.error("[searchGuestStudents]", err);
    return { error: "Gagal mencari siswa sit-in" };
  }
}

export async function addGuestToSession(userId: string, sessionId: string) {
  try {
    // Upsert to handle if they already exist as guest or regular, but we assume guest here
    await (prisma as any).attendance.create({
      data: {
        studentId: userId,
        sessionId: sessionId,
        status: "PRESENT",
        isGuest: true,
      }
    });

    revalidatePath(`/tutor/sessions/${sessionId}`);
    return { success: true };
  } catch (err) {
    console.error("[addGuestToSession]", err);
    return { error: "Gagal menambahkan siswa sit-in" };
  }
}

export async function createClassGroup(name: string, program: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Sesi tidak valid atau akses ditolak." };
    }

    const newGroup = await (prisma as any).classGroup.create({
      data: { name, program }
    });

    revalidatePath("/admin/academic/pool");
    return { success: true, classGroup: newGroup };
  } catch (err) {
    console.error("[createClassGroup]", err);
    return { error: "Gagal membuat Rombel." };
  }
}

// ============================================================================
// --- MODUL AKADEMIK: PROGRAM CLASS & CLASS SCHEDULE ---
// ============================================================================

export async function updateProgramPrice(programId: string, basePrice: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { success: false, error: "Akses ditolak. Hanya staff yang dapat mengubah harga." };
    }

    await prisma.programClass.update({
      where: { id: programId },
      data: { basePrice },
    });

    revalidatePath("/admin/classes", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("[updateProgramPrice]", err);
    return { success: false, error: "Gagal mengatur harga baru." };
  }
}


export async function getProgramClasses() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { success: false, error: "Akses ditolak" };
    }

    const programs = await prisma.programClass.findMany({
      include: {
        schedules: {
          include: {
            _count: {
              select: { enrollments: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: programs };
  } catch (err: any) {
    console.error("[getProgramClasses]", err);
    return { success: false, error: err?.message || "Gagal mengambil data Program Class" };
  }
}

export async function createClassSchedule(data: { programId: string; title: string; dayOfWeek: string; startTime: string; endTime: string; room: string; tutorId?: string | null }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { success: false, error: "Akses ditolak. Hanya staff yang dapat membuat Jadwal Kelas." };
    }

    const newSchedule = await prisma.classSchedule.create({
      data: {
        programId: data.programId,
        title: data.title,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        tutorId: data.tutorId || null,
      },
    });

    revalidatePath("/admin/classes", "layout");

    return { success: true, data: newSchedule };
  } catch (err: any) {
    console.error("[createClassSchedule]", err);
    return { success: false, error: err?.message || "Gagal membuat Jadwal Kelas" };
  }
}

export async function updateClassSchedule(scheduleId: string, data: { title: string; dayOfWeek: string; startTime: string; endTime: string; room: string; tutorId?: string | null }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { success: false, error: "Akses ditolak." };
    }

    const updatedSchedule = await prisma.classSchedule.update({
      where: { id: scheduleId },
      data: {
        title: data.title,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        tutorId: data.tutorId || null,
      },
    });

    revalidatePath("/admin/classes", "layout");

    return { success: true, data: updatedSchedule };
  } catch (err: any) {
    console.error("[updateClassSchedule]", err);
    return { success: false, error: err?.message || "Gagal mengupdate Jadwal Kelas" };
  }
}

export async function deleteClassSchedule(scheduleId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
      return { success: false, error: "Akses ditolak." };
    }

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!schedule) {
      return { success: false, error: "Jadwal tidak ditemukan." };
    }

    if (schedule._count.enrollments > 0) {
      return { success: false, error: "Tidak dapat menghapus jadwal yang sudah memiliki murid. Pindahkan murid terlebih dahulu." };
    }

    await prisma.classSchedule.delete({
      where: { id: scheduleId },
    });

    revalidatePath("/admin/classes", "layout");

    return { success: true };
  } catch (err: any) {
    console.error("[deleteClassSchedule]", err);
    return { success: false, error: err?.message || "Gagal menghapus Jadwal Kelas" };
  }
}
