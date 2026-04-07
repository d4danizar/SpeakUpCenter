"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Legacy — used by student dashboard (accepts userId directly)
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, message: "Password minimal 6 karakter." };
    }

    if (currentPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: "User tidak ditemukan." };

      const isValid = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
      if (!isValid) {
        return { success: false, message: "Password lama tidak sesuai." };
      }
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: "Password berhasil diperbarui." };
  } catch (error) {
    console.error("[updateUserPassword]", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

// ── Secure Change Password (session-based, all roles) ────────────────────────
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Sesi tidak valid. Silakan login ulang." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "Password baru minimal 6 karakter." };
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { success: false, message: "User tidak ditemukan." };

    const isValid = await bcrypt.compare(oldPassword.trim(), user.passwordHash);
    if (!isValid) {
      return { success: false, message: "Password lama tidak sesuai." };
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return { success: true, message: "Password berhasil diperbarui! 🎉" };
  } catch (error) {
    console.error("[changePassword]", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

