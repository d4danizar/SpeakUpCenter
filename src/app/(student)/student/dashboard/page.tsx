import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentAttendances, getStudentEvaluations } from "./actions";
import { StudentDashboardClient } from "./StudentDashboardClient";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { prisma } from "../../../../lib/prisma";

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
