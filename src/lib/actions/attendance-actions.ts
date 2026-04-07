"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function runDailyAutoAbsence() {
  try {
    // 1. Tentukan batas waktu hari ini (00:00 - 23:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. Ambil semua Sesi yang dijadwalkan hari ini
    const todaysSessions = await prisma.session.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd }
      },
      include: {
        schedule: {
          include: {
            enrollments: {
              select: { studentId: true }
            }
          }
        }
      }
    });

    if (todaysSessions.length === 0) {
      return { error: "Tidak ada sesi kelas yang dijadwalkan hari ini." };
    }

    let alpaCount = 0;

    // 3. Loop setiap sesi hari ini
    for (const session of todaysSessions) {
      // 4. Ambil daftar siswa yang terdaftar di jadwal (ClassSchedule) sesi ini via Enrollment
      const enrolledStudentIds = session.schedule.enrollments.map(e => e.studentId);

      // 5. Loop setiap murid yang terdaftar
      for (const studentId of enrolledStudentIds) {
        // Cek apakah murid ini sudah punya record absensi di sesi ini
        const existingAttendance = await prisma.attendance.findFirst({
          where: { sessionId: session.id, studentId }
        });

        // 6. Jika BELUM DIABSEN (Bolos tanpa pamit) → HUKUM ALPA!
        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              sessionId: session.id,
              studentId,
              status: "ABSENT",
              tutorNotes: "Auto-Alpa by System",
            }
          });
          alpaCount++;
        }
      }

      // Tandai sesi sebagai selesai secara sistem
      await prisma.session.update({
        where: { id: session.id },
        data: { isCompleted: true }
      });
    }

    revalidatePath("/admin/classes");
    return { success: true, message: `Sapu bersih selesai! ${alpaCount} murid otomatis ditandai Alpa.` };
  } catch (error: any) {
    console.error("Auto-Absence Error:", error);
    return { error: "Gagal menjalankan Auto-Alpa. Silakan coba lagi." };
  }
}
