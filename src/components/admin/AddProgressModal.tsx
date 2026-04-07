"use client";

import { useState, useTransition } from "react";
import { X, Plus, History, ExternalLink } from "lucide-react";
import { addProgressLog } from "../../lib/actions/kpi-actions";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type ProgressLog = {
  id: string;
  valueAdded: number;
  notes: string | null;
  proofLink: string | null;
  createdAt: string;
};

type Target = {
  id: string;
  title: string;
  unitName: string;
  targetValue: number;
  currentValue: number;
  logs: ProgressLog[];
};

export function AddProgressModal({ target }: { target: Target }) {
  const [mode, setMode] = useState<"idle" | "log" | "history">("idle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("targetId", target.id);
    startTransition(async () => {
      const res = await addProgressLog(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setMode("idle");
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  return (
    <>
      {/* Card Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setMode("log")}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Lapor Progres
        </button>
        <button
          onClick={() => setMode("history")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          Riwayat ({target.logs.length})
        </button>
      </div>

      {/* — LOG MODAL — */}
      {mode === "log" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">📝 Lapor Progres Hari Ini</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{target.title}</p>
              </div>
              <button onClick={() => setMode("idle")} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 flex flex-col gap-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Jumlah yang diselesaikan hari ini ({target.unitName})
                  </label>
                  <input
                    type="number"
                    name="valueAdded"
                    required
                    min="0.01"
                    step="any"
                    placeholder={`Contoh: 3 ${target.unitName}`}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Catatan Pekerjaan
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Apa yang dikerjakan hari ini?"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Link Bukti (Opsional)
                  </label>
                  <input
                    type="url"
                    name="proofLink"
                    placeholder="https://drive.google.com/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button type="button" onClick={() => setMode("idle")} disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                  {isPending ? "Menyimpan..." : "Simpan Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* — HISTORY MODAL — */}
      {mode === "history" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">📋 Riwayat Laporan</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{target.title}</p>
              </div>
              <button onClick={() => setMode("idle")} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
              {target.logs.length === 0 ? (
                <div className="text-center text-slate-400 py-8 font-medium">
                  Belum ada laporan untuk KPI ini.
                </div>
              ) : (
                target.logs.map((log) => (
                  <div key={log.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-bold text-slate-800">
                          +{log.valueAdded.toLocaleString("id-ID")} {target.unitName}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(log.createdAt), "EEEE, dd MMM yyyy — HH:mm", { locale: idLocale })}
                        </p>
                      </div>
                      {log.proofLink && (
                        <a
                          href={log.proofLink}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Bukti
                        </a>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-600 leading-relaxed">{log.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
