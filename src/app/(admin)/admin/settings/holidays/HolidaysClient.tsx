"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, CalendarDays, AlertTriangle } from "lucide-react";
import { addHoliday, deleteHoliday } from "./actions";

type Holiday = {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
};

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

const isSingleDay = (s: Date | string, e: Date | string) => {
  const sd = new Date(s); const ed = new Date(e);
  return sd.toDateString() === ed.toDateString();
};

export default function HolidaysClient({ initial }: { initial: Holiday[] }) {
  const [holidays, setHolidays] = useState<Holiday[]>(initial);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim() || !startDate || !endDate) {
      setError("Semua field wajib diisi.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addHoliday({ name, startDate, endDate });
      if (res.success) {
        setName(""); setStartDate(""); setEndDate("");
        // Reload data (revalidatePath akan update di server — just trigger re-fetch hint)
        window.location.reload();
      } else {
        setError(res.error || "Gagal menambah libur.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus libur nasional ini?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Tambah */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" /> Tambah Libur Nasional
        </h2>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nama Libur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Libur Lebaran, Hari Kemerdekaan..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Libur */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-red-500" />
            Daftar Libur Nasional
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {holidays.length} data
          </span>
        </div>

        {holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-400">Belum ada libur nasional</p>
            <p className="text-xs text-slate-300 mt-0.5">Gunakan form di atas untuk menambah.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {holidays.map((h) => {
              const single = isSingleDay(h.startDate, h.endDate);
              const startStr = fmt(h.startDate);
              const endStr = fmt(h.endDate);

              return (
                <li key={h.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 group transition">
                  {/* Ikon kalender */}
                  <div className="w-10 h-10 shrink-0 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{h.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {single ? startStr : `${startStr} — ${endStr}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={deletingId === h.id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Hapus"
                  >
                    {deletingId === h.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
