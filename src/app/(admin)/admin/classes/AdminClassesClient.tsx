"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign, BookOpen, Users, Edit2, SearchX } from "lucide-react";
import Link from "next/link";
import { updateProgramPrice } from "@/lib/actions/academic-actions";

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



export default function AdminClassesClient({ initialPrograms }: { initialPrograms: any[] }) {
  const [tab, setTab] = useState("all");
  const [editingPriceProgram, setEditingPriceProgram] = useState<any>(null);

  const programs = initialPrograms.filter(p => {
    const name = p.name.toLowerCase();
    if (tab === "kiddos") return name.includes("kids") || name.includes("teens") || name.includes("kiddos");
    if (tab === "adult") return name.includes("adult") || name.includes("dewasa");
    if (tab === "private") return name.includes("private") || name.includes("privat");
    return true;
  });



  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-blue-400" /> Manajemen Akademik
          </h1>
          <p className="text-slate-400 mt-1">Kelola Jadwal dan Harga dari 6 Program Utama SpeakUp Center.</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 mb-6 rounded-lg w-fit">
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === "all" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Semua</button>
        <button onClick={() => setTab("kiddos")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === "kiddos" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Kiddos</button>
        <button onClick={() => setTab("adult")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === "adult" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Adult Speak</button>
        <button onClick={() => setTab("private")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === "private" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Private</button>
      </div>

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <SearchX className="text-slate-400 mb-3" size={48} />
          <h3 className="text-lg font-medium text-slate-900">Belum ada Program di Kategori Ini</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {programs.map((program: any) => (
            <div key={program.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition duration-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight">
                    {program.name}
                  </h2>
                  <span className="bg-slate-900 text-slate-100 text-[10px] uppercase font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                    Modul {program.activeModule}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1 items-center bg-white border border-slate-200 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700">
                      {program.schedules?.reduce((acc: number, sch: any) => acc + (sch._count?.enrollments || 0), 0) || 0} Siswa
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-white border border-slate-200 py-2 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{program.durationMonths} Bln</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-indigo-50 border border-indigo-100 py-2 rounded-lg relative group overflow-hidden">
                    <button 
                      onClick={() => setEditingPriceProgram(program)}
                      className="absolute top-1 right-1 p-1 bg-white hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600 transition shadow-sm"
                      title="Edit Harga"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700 clamp-1 text-center truncate px-1 w-full text-[11px] font-bold">
                      Rp{(program.basePrice / 1000).toLocaleString('id-ID')}k
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white mt-auto">
                <Link 
                  href={`/admin/classes/${program.id}`}
                  className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white rounded-xl p-3 hover:bg-slate-800 font-semibold transition shadow-sm hover:shadow"
                >
                  Kelola Program →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPriceProgram && (
        <EditPriceModal 
          program={editingPriceProgram} 
          onClose={() => setEditingPriceProgram(null)} 
        />
      )}


    </div>
  );
}
