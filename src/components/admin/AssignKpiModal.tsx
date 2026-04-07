"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { assignKpiTarget } from "../../lib/actions/kpi-actions";

type StaffUser = {
  id: string;
  name: string;
  role: string;
};

const ROLE_LABEL: Record<string, string> = {
  MANAGER: "Manager (SPV)",
  CS: "Customer Service",
  MARKETING: "Marketing",
  CREATOR: "Creator",
};

const TRACKING_OPTIONS = [
  { value: "MANUAL", label: "Manual (input sendiri)" },
  { value: "AUTO_LEAD", label: "Auto — Lead Baru" },
  { value: "AUTO_REVENUE", label: "Auto — Revenue / Invoice" },
  { value: "AUTO_ATTENDANCE", label: "Auto — Kehadiran Kelas" },
];

export function AssignKpiModal({ users }: { users: StaffUser[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Current period default to MM-YYYY
  const now = new Date();
  const defaultPeriod = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await assignKpiTarget(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Beri Target KPI Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">🎯 Beri Target KPI Baru</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 flex flex-col gap-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Penerima Target */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Penerima Target
                  </label>
                  <select
                    name="userId"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                  >
                    <option value="">-- Pilih Staf --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({ROLE_LABEL[u.role] ?? u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Periode */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Periode (MM-YYYY)
                  </label>
                  <input
                    type="text"
                    name="period"
                    defaultValue={defaultPeriod}
                    required
                    placeholder="03-2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>

                {/* Nama KPI */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Nama KPI / Target
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder='Contoh: "Upload Video TikTok", "Follow Up Leads"'
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>

                {/* Target Value & Satuan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                      Nilai Target
                    </label>
                    <input
                      type="number"
                      name="targetValue"
                      required
                      min="0"
                      step="any"
                      placeholder="30"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                      Satuan
                    </label>
                    <input
                      type="text"
                      name="unitName"
                      required
                      placeholder="Contoh: Video, Leads"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Tracking Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Metode Tracking
                  </label>
                  <select
                    name="trackingType"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                  >
                    {TRACKING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
