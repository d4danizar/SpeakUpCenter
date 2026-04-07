import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { getStudentDescriptiveEvaluations } from "./actions";
import { FileText, User, Star } from "lucide-react";
import { format } from "date-fns";

export default async function StudentEvaluationsPage() {
  const sessionUser = await getServerSession(authOptions);
  
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const evaluations = await getStudentDescriptiveEvaluations(sessionUser.user.id);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Evaluasi Mingguan
          </h1>
          <p className="mt-1 text-sm text-slate-500 text-balance">
            Berikut adalah rapor evaluasi perkembangan belajar Anda, ditulis langsung oleh Tutor yang bertugas.
          </p>
        </div>

        {/* Evaluations List */}
        <div className="flex flex-col gap-6">
          {evaluations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center">
              <Star className="w-12 h-12 text-amber-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Belum ada evaluasi</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Belum ada rapor atau evaluasi dari Tutor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {evaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                  
                  {/* Glowing effect inside card for premium feel */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-6 md:gap-10">
                    
                    {/* Header Box */}
                    <div className="flex flex-col gap-2 md:w-1/3 flex-shrink-0">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 w-fit px-2 py-0.5 rounded-full border border-amber-100 mb-1">
                        Evaluasi Tutor
                      </span>
                      <h4 className="text-xl font-bold text-slate-900 leading-tight">
                        {format(new Date(ev.createdAt), "MMMM yyyy")}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium">
                        {format(new Date(ev.createdAt), "EEEE, d MMM yyyy")}
                      </p>
                      
                      <div className="mt-4 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {ev.tutor.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tutor</span>
                          <span className="text-sm font-semibold text-slate-700">{ev.tutor.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="flex flex-col gap-5 md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-8">
                      <div className="flex flex-col gap-1.5 mb-2 border-b border-slate-100 pb-3">
                        <h5 className="font-bold text-slate-800 text-lg">{ev.moduleName}</h5>
                        <div className="text-sm text-slate-500 font-medium">Sub-Modul: <span className="font-semibold text-slate-700">{ev.sessionType}</span></div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {ev.metrics && Object.entries(ev.metrics).map(([key, val]) => (
                          <div key={key} className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium">{key}</span>
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {ev.notes && (
                        <div className="mt-2 text-sm text-slate-600 font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                          <FileText className="w-4 h-4 text-slate-300 absolute top-4 right-4" />
                          <span className="font-bold text-slate-700 mb-1 block">Tutor Notes:</span>
                          <p className="italic leading-relaxed">&quot;{ev.notes}&quot;</p>
                        </div>
                      )}
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
