"use client";

import { useState, useEffect } from "react";
import { MapPin, Users, Activity, Edit2, Trash2, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import CreateScheduleForm from "./CreateScheduleForm";
import { updateProgramPrice, updateClassSchedule, deleteClassSchedule } from "@/lib/actions/academic-actions";

function EditPriceModal({ program, onClose }: { program: any; onClose: () => void }) {
  const [price, setPrice] = useState(program.basePrice);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateProgramPrice(program.id, Number(price));
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border w-full max-w-sm overflow-hidden p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Edit Harga: {program.name}</h3>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Base Price (Rp)</label>
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-slate-50 mb-4" 
        />
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan Harga</button>
        </div>
      </div>
    </div>
  );
}

function EditScheduleModal({ schedule, tutors, onClose }: { schedule: any; tutors: {id: string, name: string}[]; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: schedule.title,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const res = await updateClassSchedule(schedule.id, formData);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Gagal menyimpan jadwal.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Jadwal: {schedule.title}</h3>
        {error && <div className="mb-3 text-red-600 bg-red-50 p-2 rounded text-xs border border-red-100">{error}</div>}
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Nama Batch <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Hari</label>
            <select 
              value={formData.dayOfWeek}
              onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm font-medium"
            >
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Jam Mulai</label>
              <input 
                type="time" 
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Jam Selesai</label>
              <input 
                type="time" 
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Ruangan / Catatan</label>
              <input 
                type="text" 
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">Batal</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50">Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramDetailClient({ program, tutors }: { program: any, tutors: {id: string, name: string}[] }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const checkIsActive = (dayOfWeek: string, startTime: string, endTime: string) => {
    if (!currentTime) return false;
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDay = daysIndo[currentTime.getDay()];
    
    if (currentDay !== dayOfWeek) return false;
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [sh, sm] = startTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const [eh, em] = endTime.split(":").map(Number);
    const endMinutes = eh * 60 + em;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm("🚨 Apakah Anda yakin ingin menghapus jadwal ini secara permanen?")) {
      const res = await deleteClassSchedule(scheduleId);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Header Elegan */}
      <div className="mb-6 bg-slate-900 text-white p-4 sm:p-6 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row md:justify-between md:items-center gap-5">
        <div className="flex items-start gap-4">
          <Link href="/admin/classes" className="p-2 mt-1 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{program.name}</h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2 text-xs sm:text-sm font-medium">
              <span className="bg-slate-800 px-2 py-0.5 rounded">{program.durationMonths} Bulan</span>
              <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">{program.schedules?.reduce((acc: number, sch: any) => acc + (sch._count?.enrollments || 0), 0) || 0} Total Siswa</span>
            </p>
          </div>
        </div>
        <div className="flex pt-4 md:pt-0 mt-2 md:mt-0 border-t border-slate-800 md:border-0 items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block md:hidden">Harga Dasar</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider hidden md:block mb-1">Base Price</span>
              <span className="text-lg sm:text-xl font-bold">Rp{(program.basePrice).toLocaleString('id-ID')}</span>
            </div>
            <button 
              onClick={() => setEditingPrice(true)}
              className="p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition shadow-sm shrink-0"
              title="Edit Harga"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 relative">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0" /> 
            <span>Manajemen Jadwal (Lampu)</span>
          </h2>
          <div className="w-full sm:w-auto">
            <CreateScheduleForm programId={program.id} tutors={tutors} />
          </div>
        </div>

        {program.schedules && program.schedules.length > 0 ? (
          <ul className="space-y-3">
            {program.schedules.map((sch: any) => {
              const isActive = checkIsActive(sch.dayOfWeek, sch.startTime, sch.endTime);
              return (
                <li key={sch.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border shadow-sm transition relative overflow-hidden ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:shadow'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
                  
                  {/* BAGIAN KIRI: Title + Hari/Jam */}
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-base ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{sch.title}</span>
                      {isActive && <span className="text-[9px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Activity className="w-3 h-3" /> ACTIVE</span>}
                    </div>
                    <span className="text-sm text-slate-500 font-medium">{sch.dayOfWeek}, {sch.startTime} - {sch.endTime}</span>
                  </div>

                  {/* BAGIAN TENGAH: Badges Siswa & Room */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg shadow-sm">
                      <Users className="w-3.5 h-3.5" /> {sch._count?.enrollments || 0} Siswa
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm">
                      <MapPin size={13} className="text-slate-400" /> {sch.room || "No Room"}
                    </div>
                  </div>

                  {/* BAGIAN KANAN: Actions */}
                  <div className="flex gap-2 shrink-0 sm:border-l sm:border-slate-200 sm:pl-4 w-full sm:w-auto justify-end mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <button 
                      onClick={() => setEditingSchedule(sch)}
                      className="p-2 text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 shadow-sm rounded-lg transition"
                      title="Edit Jadwal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(sch.id)}
                      disabled={(sch._count?.enrollments || 0) > 0}
                      className="p-2 text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm rounded-lg transition disabled:opacity-50 disabled:bg-slate-100 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 disabled:cursor-not-allowed"
                      title={(sch._count?.enrollments || 0) > 0 ? "Tidak bisa dihapus (ada murid)" : "Hapus Jadwal"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500 font-semibold text-center bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">Belum ada jadwal untuk program ini.</p>
          </div>
        )}
      </div>

      {editingPrice && (
        <EditPriceModal 
          program={program} 
          onClose={() => setEditingPrice(false)} 
        />
      )}

      {editingSchedule && (
        <EditScheduleModal 
          schedule={editingSchedule} 
          tutors={tutors}
          onClose={() => setEditingSchedule(null)} 
        />
      )}
    </div>
  );
}
