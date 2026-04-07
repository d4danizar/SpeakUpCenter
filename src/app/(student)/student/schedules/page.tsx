import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { getStudentUpcomingSchedules } from "./actions";
import { CalendarDays, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default async function StudentSchedulesPage() {
  const sessionUser = await getServerSession(authOptions);
  
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const upcomingSchedules = await getStudentUpcomingSchedules(sessionUser.user.id);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Jadwal Kelas Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500 text-balance">
            Berikut adalah daftar kelas mendatang yang tersedia untuk Anda ikuti sesuai program yang aktif.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="flex flex-col gap-4">
          {upcomingSchedules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Tidak ada jadwal tersedia</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Belum ada jadwal kelas yang aktif untukmu saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSchedules.map((session) => (
                <div 
                  key={session.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
                >
                    <div className="bg-indigo-50/50 border-b border-indigo-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 tracking-wider uppercase">
                          {session.program?.name || "Program Reguler"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {session.title}
                      </h3>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-3 flex-grow">
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hari</span>
                          <span className="text-sm font-semibold">{session.dayOfWeek}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                          <span className="text-sm font-semibold">{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tutor</span>
                          <span className="text-sm font-semibold">{session.tutor?.name || "Belum Ditentukan"}</span>
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
