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
  return session;
}

export async function addProgramModule(data: {
  programId: string;
  title: string;
  description?: string;
}) {
  try {
    await checkAccess();

    // Auto-increment moduleNumber (terakhir + 1)
    const lastModule = await prisma.programModule.findFirst({
      where: { programId: data.programId },
      orderBy: { moduleNumber: "desc" },
      select: { moduleNumber: true },
    });
    const nextNumber = (lastModule?.moduleNumber ?? 0) + 1;

    await (prisma as any).programModule.create({
      data: {
        programId: data.programId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        moduleNumber: nextNumber,
      },
    });

    revalidatePath(`/admin/classes/${data.programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[addProgramModule]", err);
    return { success: false, error: err.message || "Gagal menambah modul." };
  }
}

export async function updateProgramModule(
  moduleId: string,
  data: { title: string; description?: string; moduleNumber?: number }
) {
  try {
    await checkAccess();

    const mod = await (prisma as any).programModule.update({
      where: { id: moduleId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        ...(data.moduleNumber !== undefined ? { moduleNumber: data.moduleNumber } : {}),
      },
    });

    revalidatePath(`/admin/classes/${mod.programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[updateProgramModule]", err);
    return { success: false, error: err.message || "Gagal mengupdate modul." };
  }
}

export async function deleteProgramModule(moduleId: string, programId: string) {
  try {
    await checkAccess();

    await (prisma as any).programModule.delete({ where: { id: moduleId } });

    // Re-number modules after deletion
    const remaining = await (prisma as any).programModule.findMany({
      where: { programId },
      orderBy: { moduleNumber: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await (prisma as any).programModule.update({
        where: { id: remaining[i].id },
        data: { moduleNumber: i + 1 },
      });
    }

    revalidatePath(`/admin/classes/${programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[deleteProgramModule]", err);
    return { success: false, error: err.message || "Gagal menghapus modul." };
  }
}
