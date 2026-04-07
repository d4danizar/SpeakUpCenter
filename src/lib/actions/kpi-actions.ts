"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { TrackingType } from "@prisma/client";

const ASSIGN_ALLOWED = ["SUPER_ADMIN", "MANAGER"];

export async function assignKpiTarget(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ASSIGN_ALLOWED.includes(session.user.role as string)) {
    return { error: "Anda tidak memiliki hak akses untuk memberi target KPI." };
  }

  const userId = formData.get("userId") as string;
  const title = formData.get("title") as string;
  const targetValue = parseFloat(formData.get("targetValue") as string);
  const unitName = formData.get("unitName") as string;
  const trackingType = (formData.get("trackingType") as TrackingType) ?? "MANUAL";
  const period = formData.get("period") as string;

  if (!userId || !title || isNaN(targetValue) || !unitName || !period) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  await prisma.staffTarget.create({
    data: {
      userId,
      title,
      targetValue,
      unitName,
      trackingType,
      period,
    },
  });

  revalidatePath("/admin/kpi");
  return { success: true };
}

export async function addProgressLog(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Sesi tidak valid." };

  const targetId = formData.get("targetId") as string;
  const valueAdded = parseFloat(formData.get("valueAdded") as string);
  const notes = (formData.get("notes") as string) || null;
  const proofLink = (formData.get("proofLink") as string) || null;

  if (!targetId || isNaN(valueAdded) || valueAdded <= 0) {
    return { error: "Jumlah progress harus lebih dari 0." };
  }

  // Prisma Transaction: log + increment currentValue atomically
  await prisma.$transaction([
    prisma.progressLog.create({
      data: { targetId, valueAdded, notes, proofLink },
    }),
    prisma.staffTarget.update({
      where: { id: targetId },
      data: { currentValue: { increment: valueAdded } },
    }),
  ]);

  revalidatePath("/admin/kpi");
  return { success: true };
}

export async function deleteKpiTarget(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ASSIGN_ALLOWED.includes(session.user.role as string)) {
    return { error: "Anda tidak memiliki hak untuk menghapus target." };
  }

  await prisma.staffTarget.delete({ where: { id } });
  revalidatePath("/admin/kpi");
  return { success: true };
}
