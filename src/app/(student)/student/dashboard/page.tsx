import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentAttendances, getStudentEvaluations } from "./actions";
import { StudentDashboardClient } from "./StudentDashboardClient";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { prisma } from "../../../../lib/prisma";
import { BookOpen, Sparkles } from "lucide-react";

export default async function StudentDashboardPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const studentId = sessionUser.user.id;

  // Concurrent data fetching
  const [profile, attendances, evaluations, announcements] = await Promise.all([
    getStudentProfile(studentId),
    getStudentAttendances(studentId),
    getStudentEvaluations(studentId),
    prisma.announcement.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
        targetRole: { in: ["ALL", "STUDENT"] }
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, message: true }
    }),
  ]);

  // Fetch modul aktif dari program murid ini (via Enrollment → ProgramClass → ProgramModule)
  const studentEnrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    select: { programClassId: true }
  });

  const activeModule = studentEnrollment ? await (prisma as any).programModule.findFirst({
    where: {
      isActive: true,
      programId: studentEnrollment.programClassId,
    },
    select: { moduleNumber: true, title: true, description: true }
  }) : null;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <Image 
          src={COMPANY_INFO.logoSmallUrl} 
          alt="Logo" 
          width={80} 
          height={80} 
          className="mb-8 opacity-80 object-contain grayscale"
          priority
        />
        <h2 className="text-xl font-bold text-slate-800">Profil tidak ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2">Gagal memuat atau belum ada data pelajar aktif.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              STUDENT PROFILE
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
              {profile.name}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 tracking-wide">
              {sessionUser.user.email}
            </p>
          </div>
        </div>

        {/* Card: Modul Berjalan Saat Ini */}
        {activeModule ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 shadow-lg text-white">
            {/* Background decoration */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Modul Berjalan Saat Ini
                </p>
                <p className="text-xl font-black leading-tight">
                  Modul {activeModule.moduleNumber} — {activeModule.title}
                </p>
                {activeModule.description && (
                  <p className="text-indigo-200 text-sm mt-1.5 leading-relaxed line-clamp-2">
                    {activeModule.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-xl font-black">{activeModule.moduleNumber}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4">
            <BookOpen className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-sm font-semibold text-slate-500">
              Belum ada modul aktif untuk periode ini.
            </p>
          </div>
        )}

        {/* Client Component */}
        <StudentDashboardClient 
          profile={profile}
          evaluations={evaluations}
          announcements={announcements}
        />

      </div>
    </div>
  );
}
