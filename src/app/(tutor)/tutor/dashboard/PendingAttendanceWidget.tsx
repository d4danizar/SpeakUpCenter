"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Clock } from "lucide-react";
import type { PendingSession } from "./pending-actions";
import { PendingEvalModal } from "./PendingEvalModal";

const CATEGORY_STYLE: Record<string, { badge: string; border: string }> = {
  KIDDOS: {
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    border: "border-l-violet-400",
  },
  ADULT_REGULAR: {
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    border: "border-l-sky-400",
  },
  PRIVATE_ACADEMIC: {
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    border: "border-l-emerald-400",
  },
  PRIVATE_EXECUTIVE: {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    border: "border-l-amber-400",
  },
};

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    KIDDOS: "Kiddos",
    ADULT_REGULAR: "Adult Regular",
    PRIVATE_ACADEMIC: "Private Academic",
    PRIVATE_EXECUTIVE: "Private Executive",
  };
  return map[cat] ?? cat;
}

export function PendingAttendanceWidget({ pending }: { pending: PendingSession[] }) {
  const [openSession, setOpenSession] = useState<PendingSession | null>(null);

  // Empty / success state
  if (pending.length === 0) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">🎉 Hebat! Semua presensi sudah beres.</h3>
        <p className="text-sm text-slate-500 max-w-sm font-medium">
          Semua pertemuan dalam 30 hari terakhir sudah tercatat dengan baik. Pertahankan! 💪
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            Terdapat <span className="font-bold">{pending.length} pertemuan</span> yang belum
            memiliki catatan presensi. Klik <span className="font-bold">"Isi Sekarang"</span> untuk mengisi langsung dari halaman ini.
          </p>
        </div>

        {pending.map((item, idx) => {
          const colors = CATEGORY_STYLE[item.programCategory] ?? {
            badge: "bg-slate-100 text-slate-600 border border-slate-200",
            border: "border-l-slate-300",
          };

          return (
            <div
              key={`${item.scheduleId}-${item.sessionDate}-${idx}`}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 border-l-4 ${colors.border} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200`}
            >
              {/* Left: Info */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide ${colors.badge}`}>
                      {categoryLabel(item.programCategory)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{item.timeSlot}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.className}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.programName}</p>
                  <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md w-fit mt-0.5">
                    📅 {item.sessionDateFormatted}
                  </span>
                </div>
              </div>

              {/* Right: CTA — now a button, not a Link */}
              <div className="shrink-0 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => setOpenSession(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 whitespace-nowrap"
                >
                  Isi Sekarang
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal — rendered outside the list so it can stack properly */}
      {openSession && (
        <PendingEvalModal
          session={openSession}
          onClose={() => setOpenSession(null)}
        />
      )}
    </>
  );
}
