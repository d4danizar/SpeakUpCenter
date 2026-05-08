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

// ─── Generate struktur kurikulum kosong (6 modul × 4 pertemuan) ─────────────
export async function generateCurriculumTemplate(programId: string) {
  try {
    await checkAccess();

    // Cek apakah sudah ada
    const existing = await (prisma as any).programModule.count({ where: { programId } });
    if (existing > 0) {
      return { success: false, error: "Kurikulum untuk program ini sudah ada. Hapus terlebih dahulu sebelum generate ulang." };
    }

    const MODULE_TITLES = [
      "Modul 1: Mengenal Diri & Kepercayaan Diri",
      "Modul 2: Teknik Berbicara & Vokal",
      "Modul 3: Storytelling & Penguasaan Panggung",
      "Modul 4: Presentasi & Persuasi",
      "Modul 5: Debat & Argumen",
      "Modul 6: Grand Performance & Showcase",
    ];

    for (let m = 0; m < 6; m++) {
      const module = await (prisma as any).programModule.create({
        data: {
          programId,
          moduleNumber: m + 1,
          title: MODULE_TITLES[m],
          description: "",
        },
      });

      const meetings = [];
      for (let p = 1; p <= 4; p++) {
        meetings.push({
          moduleId: module.id,
          meetingNumber: p,
          material: p < 4 ? `Materi Pertemuan ${p} — (klik Edit untuk mengisi)` : "Perform / Competition (klik Edit untuk mengisi detail)",
          isPerformance: p === 4,
        });
      }

      await (prisma as any).moduleMeeting.createMany({ data: meetings });
    }

    revalidatePath(`/admin/classes/${programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[generateCurriculumTemplate]", err);
    return { success: false, error: err.message || "Gagal generate kurikulum." };
  }
}

// ─── Reset seluruh kurikulum program ────────────────────────────────────────
export async function resetCurriculum(programId: string) {
  try {
    await checkAccess();
    // Cascade delete akan otomatis hapus ModuleMeeting
    await (prisma as any).programModule.deleteMany({ where: { programId } });
    revalidatePath(`/admin/classes/${programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[resetCurriculum]", err);
    return { success: false, error: err.message || "Gagal mereset kurikulum." };
  }
}

// ─── Update materi satu pertemuan ───────────────────────────────────────────
export async function updateMeeting(
  meetingId: string,
  data: { material: string; isPerformance?: boolean; programId: string }
) {
  try {
    await checkAccess();
    await (prisma as any).moduleMeeting.update({
      where: { id: meetingId },
      data: {
        material: data.material.trim(),
        ...(data.isPerformance !== undefined ? { isPerformance: data.isPerformance } : {}),
      },
    });
    revalidatePath(`/admin/classes/${data.programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[updateMeeting]", err);
    return { success: false, error: err.message ?? "Gagal menyimpan materi." };
  }
}

// ─── Update judul & deskripsi sebuah modul ──────────────────────────────────
export async function updateModule(
  moduleId: string,
  data: { title: string; description?: string; programId: string }
) {
  try {
    await checkAccess();
    await (prisma as any).programModule.update({
      where: { id: moduleId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() ?? "",
      },
    });
    revalidatePath(`/admin/classes/${data.programId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[updateModule]", err);
    return { success: false, error: err.message ?? "Gagal menyimpan modul." };
  }
}

// ─── Set modul aktif (hanya 1 per program) ───────────────────────────────────
export async function setActiveModule(moduleId: string, programId: string) {
  try {
    await checkAccess();

    // Atomik: nonaktifkan semua dulu, lalu aktifkan yang dipilih
    await prisma.$transaction([
      (prisma as any).programModule.updateMany({
        where: { programId },
        data: { isActive: false },
      }),
      (prisma as any).programModule.update({
        where: { id: moduleId },
        data: { isActive: true },
      }),
    ]);

    revalidatePath(`/admin/classes/${programId}`);
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("[setActiveModule]", err);
    return { success: false, error: err.message ?? "Gagal mengaktifkan modul." };
  }
}

// ─── Deactivate semua modul (clear active) ───────────────────────────────────
export async function clearActiveModule(programId: string) {
  try {
    await checkAccess();
    await (prisma as any).programModule.updateMany({
      where: { programId },
      data: { isActive: false },
    });
    revalidatePath(`/admin/classes/${programId}`);
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("[clearActiveModule]", err);
    return { success: false, error: err.message ?? "Gagal menonaktifkan modul." };
  }
}
