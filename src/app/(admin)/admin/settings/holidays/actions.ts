"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER"];

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
    throw new Error("Akses ditolak.");
  }
}

export async function getHolidays() {
  return prisma.globalHoliday.findMany({ orderBy: { startDate: "asc" } });
}

export async function addHoliday(data: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  try {
    await checkAdmin();
    if (!data.name.trim()) return { error: "Nama libur wajib diisi." };
    if (!data.startDate || !data.endDate) return { error: "Tanggal wajib diisi." };
    if (new Date(data.startDate) > new Date(data.endDate)) {
      return { error: "Tanggal mulai tidak boleh lebih dari tanggal selesai." };
    }

    await prisma.globalHoliday.create({
      data: {
        name: data.name.trim(),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    revalidatePath("/admin/settings/holidays");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menambah libur." };
  }
}

export async function deleteHoliday(id: string) {
  try {
    await checkAdmin();
    await prisma.globalHoliday.delete({ where: { id } });
    revalidatePath("/admin/settings/holidays");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus libur." };
  }
}
