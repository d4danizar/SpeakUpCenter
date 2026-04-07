import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { redirect } from "next/navigation";
import { TutorDashboardClient, type SessionTask, type EligibleStudent, type StudentSearchItem } from "./TutorDashboardClient";

export default async function TutorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const tutorId = session.user.id;

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentDayName = daysIndo[today.getDay()];

  console.log("LOGIN TUTOR ID:", tutorId);

  // Fetch ClassSchedules for TODAY gobally
  const schedules = await prisma.classSchedule.findMany({
    where: {
      dayOfWeek: { equals: currentDayName, mode: "insensitive" },
    },
    orderBy: { startTime: "asc" },
    include: {
      program: true,
      enrollments: {
        where: {
          student: { status: "ACTIVE" }
        },
        include: {
          student: {
            select: { id: true, name: true }
          }
        }
      },
      // Ambil session jika tutor SUDAH melakukan presensi hari ini untuk jadwal ini
      sessions: {
        where: {
          date: { gte: todayStart, lte: todayEnd }
        },
        include: {
          attendances: true
        }
      }
    }
  });

  const todaySessions: SessionTask[] = schedules.map(sch => {
    // Check if session exist for today
    const existingSession = sch.sessions[0]; // If exists, they already took attendance

    const timeSlot = `${sch.startTime} - ${sch.endTime}`;
    const programType = sch.program.name;

    // Convert enrollments to EligibleStudents
    const mergedStudents: EligibleStudent[] = sch.enrollments.map(enrol => {
      // Find historical attendance in the existing session
      const attendance = existingSession?.attendances?.find(a => a.studentId === enrol.studentId);
      
      return {
        id: enrol.student.id,
        name: enrol.student.name,
        activeProgram: programType,
        existingStatus: attendance ? attendance.status : null,
        existingPronunciation: attendance?.confidenceScore ?? null,
        existingFluency: null,
        existingVocabulary: null,
        existingNotes: attendance?.tutorNotes ?? null,
      };
    });

    return {
      id: sch.id, // we pass scheduleId here, instead of sessionId
      timeSlot,
      startTime: sch.startTime,
      endTime: sch.endTime,
      isCompleted: !!existingSession, // Completed if session exists
      className: sch.title,
      programType,
      students: mergedStudents,
      globalPoolStudents: [], // We don't need a global pool anymore if roster is strictly enrollment!
    };
  });

  // Calculate quick stats
  const totalToday = todaySessions.length;
  const pendingEvals = todaySessions.filter((s) => !s.isCompleted).length;

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [weeklyCompleted, announcements] = await Promise.all([
    prisma.session.count({
      where: {
        tutorId,
        isCompleted: true,
        date: { gte: weekStart },
      },
    }),
    prisma.announcement.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
        targetRole: { in: ["ALL", "TUTOR"] }
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, message: true }
    })
  ]);

  const isEvalDay = today.getDay() === 5 || today.getDay() === 6;

  const quickStats = [
    { label: "Classes Today", value: totalToday, iconName: "BookOpen" as const, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Evals", value: pendingEvals, iconName: "AlertCircle" as const, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "This Week", value: `${weeklyCompleted} sessions`, iconName: "Award" as const, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <TutorDashboardClient
      tutorName={session.user.name || "Tutor"}
      todaySessions={todaySessions}
      quickStats={quickStats}
      isEvalDay={isEvalDay}
      announcements={announcements}
    />
  );
}
