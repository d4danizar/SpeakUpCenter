"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

export async function createAnnouncement(data: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = data.get("title") as string;
    const message = data.get("message") as string;
    const targetRole = data.get("targetRole") as string;
    const expiresAtStr = data.get("expiresAt") as string;

    if (!title || !message || !targetRole || !expiresAtStr) {
      throw new Error("Missing required fields");
    }

    const expiresAt = new Date(expiresAtStr);
    expiresAt.setHours(23, 59, 59, 999); // Set to end of day

    await prisma.announcement.create({
      data: {
        title,
        message,
        targetRole,
        expiresAt,
        authorId: session.user.id,
      }
    });

    revalidatePath("/admin/announcements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create announcement" };
  }
}

export async function toggleAnnouncementStatus(id: string, isActive: boolean) {
  try {
    await prisma.announcement.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath("/admin/announcements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to toggle status" };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await prisma.announcement.delete({
      where: { id }
    });
    revalidatePath("/admin/announcements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete announcement" };
  }
}
