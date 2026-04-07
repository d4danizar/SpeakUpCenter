"use server";

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function submitScheduleAttendance(formData: FormData) {
  try {
    const sessionAuth = await getServerSession(authOptions);
    if (!sessionAuth?.user?.id) {
       return { error: "Authentication required" };
    }
    const loggedInTutorId = sessionAuth.user.id;

    const scheduleId = formData.get("scheduleId") as string;
    const studentIds = formData.getAll("studentId") as string[];
    const statuses = formData.getAll("status") as string[];
    const pronunciations = formData.getAll("pronunciation") as string[];
    const fluencies = formData.getAll("fluency") as string[];
    const vocabularies = formData.getAll("vocabulary") as string[];
    const tutorNotes = formData.get("tutorNotes") as string;
    const rescheduleNotes = formData.get("rescheduleNotes") as string;

    if (!scheduleId || studentIds.length === 0) {
      return { error: "Schedule ID and at least one student are required." };
    }

    // Use a transaction to atomically create/ensure session and create attendance
    await prisma.$transaction(async (tx) => {
      // 1. Dapatkan ClassSchedule untuk pembuatan Session
      const schedule = await tx.classSchedule.findUnique({
        where: { id: scheduleId },
        include: { program: true }
      });
      if (!schedule) throw new Error("Schedule tidak ditemukan.");

      const isEvalDay = formData.get("isEvalDay") === "true"; // Dari UI 

      // 2. Cek eksistensi session hari ini agar tidak duplikat
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      let session = await tx.session.findFirst({
        where: { scheduleId, date: { gte: todayStart, lte: todayEnd } }
      });

      // Jika belum ada Session untuk jadwal ini hari ini, BUAT BARU.
      if (!session) {
        session = await tx.session.create({
          data: {
            scheduleId,
            tutorId: loggedInTutorId,
            title: schedule.title,
            date: new Date(),
            branch: "CENTER_POINT",
            isCompleted: true,
            notes: tutorNotes || null
          }
        });
      } else {
         // Jika sudah ada, cukup mark isCompleted jika belum
         await tx.session.update({
           where: { id: session.id },
           data: { 
             isCompleted: true,
             notes: tutorNotes || null
           }
         });
      }

      const activeSessionId = session.id;

      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        let status = (statuses[i] || "PRESENT") as "PRESENT" | "ABSENT" | "EXCUSED" | "SICK";
        const confidenceScore = parseInt(pronunciations[i]) || null;

        // 1. Check existing attendance in the active session
        const existing = await tx.attendance.findFirst({
          where: { sessionId: activeSessionId, studentId },
        });

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              confidenceScore,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        } else {
          await tx.attendance.create({
            data: {
              sessionId: activeSessionId,
              studentId,
              status,
              confidenceScore,
              tutorNotes: tutorNotes || null,
              rescheduleNotes: rescheduleNotes || null,
            },
          });
        }
      }

    });

    revalidatePath("/tutor");
    revalidatePath("/tutor/dashboard");
    revalidatePath("/admin/users"); // Refresh data user di admin
    return { success: true };
  } catch (error: any) {
    console.error("[submitScheduleAttendance] error:", error);
    // Kembalikan response JSON yang ramah ke klien tanpa membiarkan stack trace meledak ke alert()
    return { error: "Gagal menyimpan absensi. Periksa kembali koneksi atau format data." };
  }
}
