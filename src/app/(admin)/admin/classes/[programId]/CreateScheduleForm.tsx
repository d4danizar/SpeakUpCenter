"use client";

import { useState, useTransition } from "react";
import { createClassSchedule } from "@/lib/actions/academic-actions";
import { Plus, Loader2 } from "lucide-react";

export default function CreateScheduleForm({ programId, tutors }: { programId: string, tutors: {id: string, name: string}[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: "",
    dayOfWeek: "Senin",
    startTime: "08:00",
    endTime: "10:00",
    room: ""
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createClassSchedule({
        programId,
        ...formData
      });
      if (res.success) {
        setFormData({ title: "", dayOfWeek: "Senin", startTime: "08:00", endTime: "10:00", room: "" });
        setIsOpen(false);
      } else {
        setError(res.error || "Gagal menyimpan jadwal.");
      }
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
      >
        <Plus size={16} /> Tambah Jadwal Baru
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in duration-200 text-sm">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h4 className="text-lg font-bold text-slate-900 flex flex-col">
            <span>Buat Jadwal Baru</span>
          </h4>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 transition">&times;</button>
        </div>

      {error && <div className="mb-3 text-red-600 bg-red-50 p-2 rounded text-xs">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nama Batch <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            required
            placeholder="Misal: April Weekend"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 mb-3"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Hari</label>
          <select 
            value={formData.dayOfWeek}
            onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Jam Mulai</label>
            <input 
              type="time" 
              required
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Jam Selesai</label>
            <input 
              type="time" 
              required
              value={formData.endTime}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Ruangan / Catatan</label>
            <input 
              type="text" 
              placeholder="Misal: Room A"
              value={formData.room}
              onChange={e => setFormData({ ...formData, room: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 mb-3"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">Batal</button>
          <button 
            type="submit" 
            disabled={isPending}
            className="flex justify-center items-center gap-2 bg-indigo-600 text-white rounded-lg px-5 py-2 hover:bg-indigo-700 disabled:opacity-50 font-bold transition shadow-sm"
          >
            {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
            {isPending ? "Menyimpan" : "Simpan Jadwal"}
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}
