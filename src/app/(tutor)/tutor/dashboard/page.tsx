import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { redirect } from "next/navigation";
import { TutorDashboardClient, type SessionTask, type EligibleStudent, type StudentSearchItem } from "./TutorDashboardClient";
import { getPendingAttendances } from "./pending-actions";

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
      // Ambil session hari ini (untuk cek apakah presensi sudah dilakukan)
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

  const todaySessions: SessionTask[] = await Promise.all(schedules.map(async sch => {
    const existingSession = sch.sessions[0];

    const timeSlot = `${sch.startTime} - ${sch.endTime}`;
    const programType = sch.program.name;
    const programId = sch.program.id;
    const programCategory = sch.program.category || undefined;
    const sessionId = existingSession ? existingSession.id : null;

    // Ambil Global Pool dari ProgramClass (bukan dari ClassSchedule.enrollments)
    const globalEnrollments = await prisma.enrollment.findMany({
      where: {
        programClassId: sch.programId,
        student: { status: "ACTIVE" }
      },
      include: {
        student: { select: { id: true, name: true } }
      }
    });

    const uniqueStudentsMap = new Map<string, EligibleStudent>();
    for (const en of globalEnrollments) {
      if (!uniqueStudentsMap.has(en.student.id)) {
        // Cek apakah sudah ada record absensi di sesi hari ini
        const attendance = existingSession?.attendances?.find(a => a.studentId === en.student.id);
        uniqueStudentsMap.set(en.student.id, {
          id: en.student.id,
          name: en.student.name,
          activeProgram: programType,
          existingStatus: attendance ? attendance.status : null, // null = UNMARKED by default
        });
      }
    }

    const globalPoolStudents = Array.from(uniqueStudentsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: sch.id,
      timeSlot,
      startTime: sch.startTime,
      endTime: sch.endTime,
      isCompleted: !!existingSession,
      className: sch.title,
      programId,
      programType,
      programCategory,
      sessionId,
      students: globalPoolStudents,      // backward compat alias
      globalPoolStudents,
    };
  }));

  // Calculate quick stats
  const totalToday = todaySessions.length;
  const pendingEvals = todaySessions.filter((s) => !s.isCompleted).length;

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [weeklyCompleted, announcements, pendingAttendances] = await Promise.all([
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
    }),
    getPendingAttendances(),
  ]);

  const isEvalDay = today.getDay() === 5 || today.getDay() === 6;

  const quickStats = [
    { label: "Classes Today", value: totalToday, iconName: "BookOpen" as const, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tanggungan", value: pendingAttendances.length, iconName: "AlertCircle" as const, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "This Week", value: `${weeklyCompleted} sessions`, iconName: "Award" as const, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <TutorDashboardClient
      tutorName={session.user.name || "Tutor"}
      todaySessions={todaySessions}
      quickStats={quickStats}
      isEvalDay={isEvalDay}
      announcements={announcements}
      pendingAttendances={pendingAttendances}
    />
  );
}
