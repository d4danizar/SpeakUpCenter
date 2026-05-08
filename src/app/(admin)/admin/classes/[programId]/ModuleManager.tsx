"use client";

import { useState } from "react";
import { BookOpen, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, Loader2 } from "lucide-react";
import { addProgramModule, updateProgramModule, deleteProgramModule } from "@/lib/actions/module-actions";

type Module = {
  id: string;
  order: number;
  title: string;
  description: string | null;
};

// ─────────────────────────────────────────────
// Modal Tambah Modul
// ─────────────────────────────────────────────
function AddModuleModal({ programId, onClose }: { programId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Judul modul wajib diisi."); return; }
    setLoading(true);
    setError(null);
    const res = await addProgramModule({ programId, title, description });
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Gagal menyimpan.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" /> Tambah Modul Baru
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Judul Modul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: Pertemuan 1 - Pengenalan Public Speaking"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Deskripsi / Materi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Isi materi yang akan diajarkan pada pertemuan ini..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal Edit Modul
// ─────────────────────────────────────────────
function EditModuleModal({ module, onClose }: { module: Module; onClose: () => void }) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Judul modul wajib diisi."); return; }
    setLoading(true);
    setError(null);
    const res = await updateProgramModule(module.id, { title, description });
    setLoading(false);
    if (res.success) onClose();
    else setError(res.error || "Gagal menyimpan.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Edit Pertemuan {module.order}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Judul Modul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Deskripsi / Materi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Komponen Utama: ModuleManager
// ─────────────────────────────────────────────
export default function ModuleManager({
  programId,
  initialModules,
}: {
  programId: string;
  initialModules: Module[];
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (mod: Module) => {
    if (!confirm(`Hapus Pertemuan ${mod.order}: "${mod.title}"?`)) return;
    setDeletingId(mod.id);
    await deleteProgramModule(mod.id, programId);
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Kurikulum & Modul
          <span className="ml-1 text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {initialModules.length} Pertemuan
          </span>
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Pertemuan
        </button>
      </div>

      {/* Daftar Modul */}
      {initialModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Belum ada modul</p>
          <p className="text-xs text-slate-400 mt-1">Klik "Tambah Pertemuan" untuk mulai menyusun kurikulum.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {initialModules.map((mod) => (
            <li key={mod.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition group">
              {/* Nomor urut */}
              <div className="w-8 h-8 shrink-0 mt-0.5 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-sm">
                {mod.order}
              </div>

              {/* Konten */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-tight">{mod.title}</p>
                {mod.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{mod.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setEditingModule(mod)}
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition"
                  title="Edit Modul"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(mod)}
                  disabled={deletingId === mod.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition disabled:opacity-50"
                  title="Hapus Modul"
                >
                  {deletingId === mod.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddModuleModal programId={programId} onClose={() => setShowAddModal(false)} />
      )}
      {editingModule && (
        <EditModuleModal module={editingModule} onClose={() => setEditingModule(null)} />
      )}
    </div>
  );
}
