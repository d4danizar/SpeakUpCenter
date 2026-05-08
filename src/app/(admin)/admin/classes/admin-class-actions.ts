"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const STAFF_ALLOWED = ["SUPER_ADMIN", "MANAGER"];

async function checkAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !STAFF_ALLOWED.includes(session.user.role as string)) {
    throw new Error("Akses ditolak. Hanya Super Admin atau Manager.");
  }
}

/**
 * Derive ProgramCategory enum from the program name string.
 * Kiddos → KIDDOS, Adult → ADULT_REGULAR, Private Exec → PRIVATE_EXECUTIVE, dst.
 */
function deriveCategory(programName: string): "KIDDOS" | "ADULT_REGULAR" | "PRIVATE_ACADEMIC" | "PRIVATE_EXECUTIVE" {
  const lower = programName.toLowerCase();
  if (lower.includes("kiddos") || lower.includes("kids") || lower.includes("teens")) return "KIDDOS";
  if (lower.includes("executive") || lower.includes("exec")) return "PRIVATE_EXECUTIVE";
  if (lower.includes("private") || lower.includes("privat")) return "PRIVATE_ACADEMIC";
  return "ADULT_REGULAR";
}

/**
 * Buat ProgramClass baru.
 * - className : Nama kelas lengkap (tampil di UI card), misal "Kiddos Kids A"
 * - programName : Label program utama untuk grouping, misal "Kiddos"
 * - durationMonths : Durasi program (bulan)
 * - basePrice : Harga dasar
 */
export async function createProgramClass(data: {
  className: string;
  programName: string;
  durationMonths: number;
  basePrice: number;
}) {
  try {
    await checkAccess();

    const { className, programName, durationMonths, basePrice } = data;

    if (!className.trim() || !programName.trim()) {
      return { error: "Nama kelas dan nama program wajib diisi." };
    }

    const category = deriveCategory(programName);

    const newClass = await prisma.programClass.create({
      data: {
        name: className.trim(),
        category,
        durationMonths: Number(durationMonths) || 0,
        basePrice: Number(basePrice) || 0,
        activeModule: 1,
        branch: "CENTER_POINT",
      },
    });

    revalidatePath("/admin/classes");
    return { success: true, programClass: newClass };
  } catch (err: any) {
    console.error("[createProgramClass]", err);
    return { error: err.message || "Gagal membuat kelas baru." };
  }
}

/**
 * Hapus ProgramClass (hanya jika belum punya murid terdaftar).
 */
export async function deleteProgramClass(programClassId: string) {
  try {
    await checkAccess();

    const enrollmentCount = await prisma.enrollment.count({
      where: { programClassId },
    });

    if (enrollmentCount > 0) {
      return {
        error: `Tidak bisa dihapus. Masih ada ${enrollmentCount} murid terdaftar di kelas ini.`,
      };
    }

    await prisma.programClass.delete({ where: { id: programClassId } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (err: any) {
    console.error("[deleteProgramClass]", err);
    return { error: err.message || "Gagal menghapus kelas." };
  }
}
