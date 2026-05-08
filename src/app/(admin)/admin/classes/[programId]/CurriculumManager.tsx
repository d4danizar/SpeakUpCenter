"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronRight, Sparkles, RotateCcw,
  Edit2, Save, X, Star, Loader2, Trophy
} from "lucide-react";
import {
  generateCurriculumTemplate,
  resetCurriculum,
  updateMeeting,
  updateModule,
  setActiveModule,
  clearActiveModule,
} from "@/lib/actions/curriculum-actions";

// ─── Types ───────────────────────────────────────────────────────────────────
type Meeting = {
  id: string;
  meetingNumber: number;
  material: string;
  isPerformance: boolean;
};

type Module = {
  id: string;
  moduleNumber: number;
  title: string;
  description: string | null;
  isActive: boolean;
  meetings: Meeting[];
};

// ─── Edit Meeting Modal ───────────────────────────────────────────────────────
function EditMeetingModal({
  meeting,
  moduleTitle,
  programId,
  onClose,
}: {
  meeting: Meeting;
  moduleTitle: string;
  programId: string;
  onClose: () => void;
}) {
  const [material, setMaterial] = useState(meeting.material);
  const [isPerformance, setIsPerformance] = useState(meeting.isPerformance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!material.trim()) { setError("Materi tidak boleh kosong."); return; }
    setLoading(true);
    const res = await updateMeeting(meeting.id, { material, isPerformance, programId });
    setLoading(false);
    if (res.success) onClose();
    else setError(res.error ?? "Gagal menyimpan.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{moduleTitle}</p>
            <h3 className="text-sm font-bold text-slate-900">Edit Pertemuan {meeting.meetingNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Materi / Aktivitas <span className="text-red-500">*</span>
            </label>
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              rows={4}
              placeholder="Jelaskan materi atau aktivitas yang dilakukan pada pertemuan ini..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setIsPerformance(!isPerformance)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPerformance ? "bg-amber-500" : "bg-slate-200"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isPerformance ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Trophy className={`w-4 h-4 ${isPerformance ? "text-amber-500" : "text-slate-400"}`} />
              Pertemuan Performance / Kompetisi
            </span>
          </label>
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

// ─── Edit Module Modal ────────────────────────────────────────────────────────
function EditModuleModal({
  module,
  programId,
  onClose,
}: {
  module: Module;
  programId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Judul modul tidak boleh kosong."); return; }
    setLoading(true);
    const res = await updateModule(module.id, { title, description, programId });
    setLoading(false);
    if (res.success) onClose();
    else setError(res.error ?? "Gagal menyimpan.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Edit Modul {module.moduleNumber}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Judul Modul *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition">Batal</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CurriculumManager({
  programId,
  initialModules,
}: {
  programId: string;
  initialModules: Module[];
}) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [editingMeeting, setEditingMeeting] = useState<{ meeting: Meeting; moduleTitle: string } | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!confirm("Generate format kurikulum 6 Modul × 4 Pertemuan untuk program ini?")) return;
    setGenerating(true);
    const res = await generateCurriculumTemplate(programId);
    setGenerating(false);
    if (!res.success) alert(res.error ?? "Gagal generate.");
  };

  const handleReset = async () => {
    if (!confirm("⚠️ Reset akan menghapus SELURUH kurikulum program ini. Lanjutkan?")) return;
    setResetting(true);
    await resetCurriculum(programId);
    setResetting(false);
  };

  const handleToggleActive = async (mod: Module) => {
    setTogglingId(mod.id);
    if (mod.isActive) {
      await clearActiveModule(programId);
    } else {
      await setActiveModule(mod.id, programId);
    }
    setTogglingId(null);
  };

  const hasModules = initialModules.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Sistem Modul Rotasi
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              6 Modul × 4 Pertemuan
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Pertemuan ke-4 tiap modul adalah sesi Performance / Kompetisi.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasModules && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition disabled:opacity-50"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Reset
            </button>
          )}
          {!hasModules && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Format Kurikulum
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!hasModules && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="text-sm font-bold text-slate-600">Kurikulum belum dibuat</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Klik <span className="font-bold text-indigo-600">"Generate Format Kurikulum"</span> untuk otomatis membuat
            kerangka 6 Modul × 4 Pertemuan yang bisa diedit.
          </p>
        </div>
      )}

      {/* Module Accordion */}
      {hasModules && (
        <div className="divide-y divide-slate-100">
          {initialModules.map((mod) => {
            const isOpen = openModules.has(mod.id);
            const performanceMeeting = mod.meetings.find((m) => m.isPerformance);

            return (
              <div key={mod.id}>
                {/* Module Header (Accordion trigger) */}
                <div className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition select-none ${isOpen ? "bg-indigo-50/60" : ""} ${mod.isActive ? "border-l-4 border-emerald-500" : ""}`}>
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {/* Nomor Modul */}
                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
                      mod.isActive ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
                    }`}>
                      {mod.moduleNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{mod.title}</p>
                        {mod.isActive && (
                          <span className="shrink-0 text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✦ AKTIF
                          </span>
                        )}
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{mod.description}</p>
                      )}
                    </div>
                    {performanceMeeting && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        <Trophy className="w-3 h-3" /> Performance
                      </span>
                    )}
                    <div className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Toggle Active + Edit Module Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(mod); }}
                      disabled={togglingId === mod.id}
                      title={mod.isActive ? "Nonaktifkan modul ini" : "Jadikan modul aktif"}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition disabled:opacity-50 ${
                        mod.isActive
                          ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                          : "bg-white text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
                      }`}
                    >
                      {togglingId === mod.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Star className={`w-3 h-3 ${mod.isActive ? "fill-white" : ""}`} />}
                      {mod.isActive ? "Aktif" : "Aktifkan"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingModule(mod); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit judul modul"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meeting List (Accordion body) */}
                {isOpen && (
                  <div className="bg-slate-50/50 border-t border-slate-100">
                    {mod.meetings.length === 0 ? (
                      <p className="px-14 py-4 text-xs text-slate-400 italic">Belum ada data pertemuan.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {mod.meetings.map((meeting) => (
                          <li
                            key={meeting.id}
                            className={`flex items-start gap-3 px-5 py-3 group ${meeting.isPerformance ? "bg-amber-50/60" : ""}`}
                          >
                            {/* Dot */}
                            <div className={`w-7 h-7 shrink-0 mt-0.5 rounded-full flex items-center justify-center text-xs font-bold ${meeting.isPerformance ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                              {meeting.isPerformance ? <Trophy className="w-3.5 h-3.5" /> : meeting.meetingNumber}
                            </div>

                            {/* Konten */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-bold text-slate-600">
                                  Pertemuan {meeting.meetingNumber}
                                  {meeting.isPerformance && (
                                    <span className="ml-1.5 text-amber-600">(Performance)</span>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{meeting.material}</p>
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingMeeting({ meeting, moduleTitle: mod.title })}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition shrink-0 opacity-0 group-hover:opacity-100"
                              title="Edit materi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting.meeting}
          moduleTitle={editingMeeting.moduleTitle}
          programId={programId}
          onClose={() => setEditingMeeting(null)}
        />
      )}
      {editingModule && (
        <EditModuleModal
          module={editingModule}
          programId={programId}
          onClose={() => setEditingModule(null)}
        />
      )}
    </div>
  );
}
