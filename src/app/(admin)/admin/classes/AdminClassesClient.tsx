"use client";

import { useState } from "react";
import {
  Clock, DollarSign, BookOpen, Users, Edit2, SearchX,
  UploadCloud, Plus, X, Trash2, Loader2
} from "lucide-react";
import Link from "next/link";
import { updateProgramPrice } from "@/lib/actions/academic-actions";
import { createProgramClass, deleteProgramClass } from "./admin-class-actions";

// ── Toast helper ─────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl border max-w-sm ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-rose-50 border-rose-200 text-rose-800"
      }`}
    >
      <span className="text-lg leading-none">{type === "success" ? "✅" : "❌"}</span>
      <p className="text-sm font-semibold flex-1">{msg}</p>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Edit Price Modal ──────────────────────────────────────────────────────────

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
      <div className="bg-white rounded-2xl shadow-xl border w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Harga: {program.name}</h3>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Base Price (Rp)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-slate-50 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Menyimpan…" : "Simpan Harga"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Program Class Modal ────────────────────────────────────────────────

const PROGRAM_PRESETS = [
  "Kiddos",
  "Adult Speak",
  "Private - Akademik",
  "Private - Executive",
];

function CreateClassModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newClass: any) => void;
}) {
  const [form, setForm] = useState({
    programName: PROGRAM_PRESETS[0],
    customProgram: "",
    className: "",
    durationMonths: "2",
    basePrice: "1800000",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalProgram = form.programName === "__custom__" ? form.customProgram : form.programName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.className.trim()) {
      setError("Nama kelas wajib diisi.");
      return;
    }
    if (!finalProgram.trim()) {
      setError("Nama program wajib diisi.");
      return;
    }

    setLoading(true);
    const res = await createProgramClass({
      className: form.className.trim(),
      programName: finalProgram.trim(),
      durationMonths: parseInt(form.durationMonths) || 0,
      basePrice: parseInt(form.basePrice) || 0,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onSuccess(res.programClass);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">➕ Tambah Kelas Baru</h3>
            <p className="text-indigo-200 text-xs mt-0.5">Buat kelas baru dalam sistem akademik</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Program Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Nama Program Utama
            </label>
            <select
              value={form.programName}
              onChange={(e) => setForm({ ...form, programName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
            >
              {PROGRAM_PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="__custom__">✏️ Ketik Sendiri…</option>
            </select>
            {form.programName === "__custom__" && (
              <input
                type="text"
                placeholder="Contoh: EF Training, IELTS Prep…"
                value={form.customProgram}
                onChange={(e) => setForm({ ...form, customProgram: e.target.value })}
                className="mt-2 w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Program = pengelompokan besar. Kategori (Kiddos/Adult) otomatis terdeteksi dari nama program.
            </p>
          </div>

          {/* Class Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Nama Kelas Spesifik <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Kiddos Kids A, Adult Speak Sore, Private Rabu"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              required
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Nama ini yang tampil di kartu kelas dan portal murid.</p>
          </div>

          {/* Duration & Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Durasi (Bulan)
              </label>
              <input
                type="number"
                min={0}
                placeholder="2"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Harga Dasar (Rp)
              </label>
              <input
                type="number"
                min={0}
                placeholder="1800000"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Membuat…</>
              ) : (
                <><Plus className="w-4 h-4" /> Buat Kelas</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminClassesClient({ initialPrograms }: { initialPrograms: any[] }) {
  const [tab, setTab] = useState("all");
  const [programs, setPrograms] = useState<any[]>(initialPrograms);
  const [editingPriceProgram, setEditingPriceProgram] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreated = (newClass: any) => {
    // Tambahkan _count default agar card langsung render dengan benar
    const normalized = { ...newClass, _count: { enrollments: 0 }, schedules: [] };
    setPrograms((prev) => [normalized, ...prev]);
    showToast(`✅ Kelas "${newClass.name}" berhasil dibuat!`, "success");
  };

  const handleDelete = async (programId: string, programName: string) => {
    if (!confirm(`Hapus kelas "${programName}"? Aksi ini tidak bisa dibatalkan.`)) return;
    setDeletingId(programId);
    const res = await deleteProgramClass(programId);
    setDeletingId(null);
    if (res.error) {
      showToast(res.error, "error");
    } else {
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
      showToast(`Kelas "${programName}" dihapus.`, "success");
    }
  };

  const filtered = programs.filter((p) => {
    const name = p.name.toLowerCase();
    if (tab === "kiddos") return name.includes("kids") || name.includes("teens") || name.includes("kiddos");
    if (tab === "adult") return name.includes("adult") || name.includes("dewasa");
    if (tab === "private") return name.includes("private") || name.includes("privat");
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-blue-400" /> Manajemen Akademik
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola Kelas &amp; Program SpeakUp Center.{" "}
            <span className="text-emerald-400 font-bold">{programs.length} kelas aktif.</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Tambah Kelas */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Kelas Baru
          </button>
          {/* Import Rubrik */}
          <Link
            href="/admin/classes/import-rubrics"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm whitespace-nowrap"
          >
            <UploadCloud className="w-4 h-4" /> Import Rubrik (Excel)
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 mb-6 rounded-lg w-fit">
        {[
          { key: "all", label: "Semua" },
          { key: "kiddos", label: "Kiddos" },
          { key: "adult", label: "Adult Speak" },
          { key: "private", label: "Private" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === key ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <SearchX className="text-slate-400 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Belum ada kelas di kategori ini</h3>
          <p className="text-sm text-slate-400 mb-4">Klik tombol &ldquo;Tambah Kelas Baru&rdquo; untuk memulai.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow transition text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Kelas Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition duration-200 group"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight flex-1">
                    {program.name}
                  </h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="bg-slate-900 text-slate-100 text-[10px] uppercase font-bold px-2 py-1 rounded-md shadow-sm">
                      Modul {program.activeModule}
                    </span>
                    {/* Delete btn — hover reveal */}
                    <button
                      onClick={() => handleDelete(program.id, program.name)}
                      disabled={deletingId === program.id}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Hapus kelas"
                    >
                      {deletingId === program.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1 items-center bg-white border border-slate-200 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700">
                      {program._count?.enrollments ?? 0} Siswa
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-white border border-slate-200 py-2 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">{program.durationMonths} Bln</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-indigo-50 border border-indigo-100 py-2 rounded-lg relative">
                    <button
                      onClick={() => setEditingPriceProgram(program)}
                      className="absolute top-1 right-1 p-1 bg-white hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600 transition shadow-sm"
                      title="Edit Harga"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700 truncate px-1 w-full text-center text-[11px] font-bold">
                      Rp{(program.basePrice / 1000).toLocaleString("id-ID")}k
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

      {/* Modals */}
      {editingPriceProgram && (
        <EditPriceModal
          program={editingPriceProgram}
          onClose={() => setEditingPriceProgram(null)}
        />
      )}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreated}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
