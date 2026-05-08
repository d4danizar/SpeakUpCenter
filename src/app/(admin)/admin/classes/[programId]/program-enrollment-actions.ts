"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const STAFF_ALLOWED = ["SUPER_ADMIN", "MANAGER", "CS"];

async function checkAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
    throw new Error("Akses ditolak.");
  }
}

/** Daftarkan murid ke ProgramClass (Global Pool) */
export async function enrollStudentToProgram(
  studentId: string,
  programClassId: string,
  preferredScheduleId?: string | null
) {
  try {
    await checkAccess();

    const existing = await prisma.enrollment.findFirst({
      where: { studentId, programClassId },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "Murid sudah terdaftar di program ini." };
    }

    await prisma.enrollment.create({
      data: {
        studentId,
        programClassId,
        preferredScheduleId: preferredScheduleId ?? null,
        startDate: new Date(),
        frozenPrice: 0,
      },
    });

    revalidatePath(`/admin/classes/${programClassId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[enrollStudentToProgram]", err);
    return { success: false, error: err.message || "Gagal mendaftarkan murid." };
  }
}

/** Keluarkan murid dari ProgramClass */
export async function removeStudentFromProgram(enrollmentId: string, programClassId: string) {
  try {
    await checkAccess();

    await prisma.enrollment.delete({ where: { id: enrollmentId } });

    revalidatePath(`/admin/classes/${programClassId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[removeStudentFromProgram]", err);
    return { success: false, error: err.message || "Gagal mengeluarkan murid." };
  }
}

/** Ambil daftar semua murid AKTIF yang belum terdaftar di program ini (untuk pencarian) */
export async function getUnenrolledStudents(programClassId: string) {
  try {
    await checkAccess();

    const enrolledIds = await prisma.enrollment.findMany({
      where: { programClassId },
      select: { studentId: true },
    });

    const enrolledStudentIds = enrolledIds.map((e) => e.studentId);

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        id: { notIn: enrolledStudentIds },
      },
      select: { id: true, name: true, email: true, phoneNumber: true },
      orderBy: { name: "asc" },
    });

    return students;
  } catch (err: any) {
    console.error("[getUnenrolledStudents]", err);
    return [];
  }
}
