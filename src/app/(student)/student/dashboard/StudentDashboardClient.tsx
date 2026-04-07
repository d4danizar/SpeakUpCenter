"use client";

import { addMonths, differenceInDays, format } from "date-fns";
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  Sparkles, 
  GraduationCap,
  Bell,
  Lock,
  Download,
  Star
} from "lucide-react";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";

type ProfileContent = {
  id: string;
  name: string;
  email: string;
  leaveQuota: number;
  leaveUsed: number;
  enrollments: {
    startDate: Date;
    schedule: {
      title: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      room: string;
      program: {
        name: string;
        durationMonths: number;
      }
    }
  }[];
};

export function StudentDashboardClient({
  profile,
  evaluations,
  announcements,
}: {
  profile: ProfileContent;
  evaluations: any[]; // The new evaluation list
  announcements: { id: string; title: string; message: string }[];
}) {
  // 1. Calculations for Estimasi Lulus (Graduation)
  const enrollment = profile.enrollments?.[0]; // Assume easiest fallback for now
  const startDate = enrollment?.startDate ? new Date(enrollment.startDate) : new Date();
  
  // As per instruction, fallback duration is 2 if 0
  const durationM = enrollment?.schedule?.program?.durationMonths || 2;
  const estimatedGraduation = addMonths(startDate, durationM);
  
  const today = new Date();
  const rawDaysLeft = differenceInDays(estimatedGraduation, today);
  const totalDays = differenceInDays(estimatedGraduation, startDate) || 60; // fallback divisor
  const daysLeft = Math.max(0, rawDaysLeft);
  
  const isGraduated = rawDaysLeft <= 0;
  const progressPercent = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. HEADER HERO & ESTIMASI LULUS */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 border border-slate-100 shadow-sm relative overflow-hidden">
        {/* Dekorasi Logo Background */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-[0.03] pointer-events-none rotate-12">
          <Image src={COMPANY_INFO.logoSmallUrl} alt="Watermark" fill unoptimized style={{ objectFit: "contain" }} />
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              Halo, {profile.name.split(" ")[0]}! 👋
            </h2>
            <p className="text-slate-500 font-medium max-w-md">
              Selamat datang kembali di Portal Belajar. Tetap semangat mengasah kemampuan public speaking Anda hari ini.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full md:w-auto min-w-[240px]">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress Kelas</span>
              <span className="text-sm font-black text-indigo-600">{Math.round(progressPercent)}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">EST. LULUS</span>
                <span className="font-semibold text-slate-700 text-sm">{format(estimatedGraduation, "dd MMM yyyy")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">SISA</span>
                {isGraduated ? (
                   <span className="font-bold text-emerald-600 text-sm flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/> Selesai</span>
                ) : (
                   <span className="font-bold text-slate-700 text-sm">{daysLeft} HARI</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BANNER PENGUMUMAN */}
      <div className="mb-6">
        <AnnouncementBanner announcements={announcements} />
      </div>

      {/* 3. GRID KARTU AKADEMIK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KARTU JADWAL */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Jadwal Kelas</h3>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {enrollment ? (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200 mb-2 inline-block">
                  {enrollment.schedule.program.name}
                </span>
                <h4 className="font-bold text-slate-800 text-base mb-3 leading-tight">{enrollment.schedule.title}</h4>
                
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span>{enrollment.schedule.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{enrollment.schedule.startTime} - {enrollment.schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{enrollment.schedule.room}</span>
                  </div>
                </div>
              </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                 <p className="text-sm font-semibold text-slate-400">Belum tergabung dalam jadwal.</p>
               </div>
            )}
          </div>
        </section>

        {/* KARTU EVALUASI & NILAI */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Evaluasi & Nilai</h3>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {evaluations && evaluations.length > 0 ? (
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {evaluations.map((ev) => (
                  <div key={ev.id} className="border border-slate-200 bg-white shadow-sm rounded-2xl p-5 flex flex-col">
                    
                    {/* 1. HEADER KARTU (Top Area) */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full truncate max-w-[60%]">
                        {ev.program?.name || "Program"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap mt-0.5">
                        {format(new Date(ev.createdAt), "dd MMM yyyy")}
                      </span>
                    </div>

                    {/* 2. TITLE & INFO AREA (Middle Area) */}
                    <div className="mt-1">
                      <h4 className="font-semibold text-lg text-slate-800 leading-snug">{ev.moduleName}</h4>
                      <p className="text-sm text-slate-500 mt-1 font-medium">
                        {ev.sessionType} &bull; Tutor: <span className="font-semibold text-slate-600">{ev.tutor?.name || "Unknown"}</span>
                      </p>
                    </div>
                    
                    <hr className="my-4 border-slate-100" />

                    {/* 3. METRICS LIST (Bottom Area) */}
                    <div className="space-y-2">
                      {ev.metrics && Object.entries(ev.metrics).map(([key, val]) => {
                        // Premium coloring logic
                        let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                        if (val === 'A') badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        else if (val === 'B') badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                        else if (val === 'E') badgeColor = "bg-rose-50 text-rose-700 border-rose-100";

                        return (
                          <div key={key} className="flex justify-between items-center px-3 py-2 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                            <span className="text-sm text-slate-700 font-medium">{key}</span>
                            <span className={`px-3 py-1 font-bold rounded-md border text-xs shadow-sm ${badgeColor}`}>
                              {val as string}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes (Tutor Feedback) */}
                    {ev.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                         <div className="text-xs text-slate-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100 leading-relaxed shadow-sm">
                           <span className="font-semibold text-amber-700 mr-1 not-italic">Komentar Pelatih:</span>
                           "{ev.notes}"
                         </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Image src="/eval-ill.png" alt="No Eval" width={120} height={120} className="opacity-20 mb-3" />
                <h4 className="text-sm font-bold text-slate-400">Belum Ada Evaluasi</h4>
                <p className="text-xs text-slate-400 mt-1">Nilai perkembangan dari tutor akan muncul secara otomatis di sini.</p>
              </div>
            )}
          </div>
        </section>

        {/* KARTU SERTIFIKAT */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sertifikat Kelulusan</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
             {!isGraduated ? (
               <>
                 <div className="p-3 bg-slate-200/50 text-slate-400 rounded-full mb-3">
                   <Lock className="w-6 h-6" />
                 </div>
                 <h4 className="text-sm font-bold text-slate-600">Sertifikat Terkunci</h4>
                 <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed max-w-[200px]">
                   Sertifikat akan otomatis terbuka setelah Anda menyelesaikan masa belajar di kelas.
                 </p>
                 <button disabled className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                   BELUM TERSEDIA
                 </button>
               </>
             ) : (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3 shadow-inner shadow-emerald-200/50 relative z-10">
                    <Download className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-800 relative z-10">Sertifikat Tersedia!</h4>
                  <p className="text-xs text-emerald-600/80 mt-1 mb-4 leading-relaxed font-medium relative z-10">
                    Selamat, e-Sertifikat kelulusan Anda sudah bisa diunduh.
                  </p>
                  <button className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 text-xs font-bold uppercase tracking-widest transition-colors relative z-10">
                    <Download className="w-4 h-4"/> UNDUH PDF
                  </button>
                </>
             )}
          </div>
        </section>

      </div>
    </div>
  );
}
