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

    // Tentukan auto-order (terakhir + 1)
    const lastModule = await prisma.programModule.findFirst({
      where: { programId: data.programId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastModule?.order ?? 0) + 1;

    await prisma.programModule.create({
      data: {
        programId: data.programId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        order: nextOrder,
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
  data: { title: string; description?: string; order?: number }
) {
  try {
    await checkAccess();

    const mod = await prisma.programModule.update({
      where: { id: moduleId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        ...(data.order !== undefined ? { order: data.order } : {}),
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

    await prisma.programModule.delete({ where: { id: moduleId } });

    // Re-number modules setelah penghapusan
    const remaining = await prisma.programModule.findMany({
      where: { programId },
      orderBy: { order: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.programModule.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }

    revalidatePath(`/admin/classes/${programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[deleteProgramModule]", err);
    return { success: false, error: err.message || "Gagal menghapus modul." };
  }
}
