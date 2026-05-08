"use client";

import { useState, useTransition } from "react";
import {
  Star, Save, Loader2, X, CheckCircle, AlertTriangle,
  UserCheck, UserX, MessageSquare, Info, Clock,
} from "lucide-react";
import { upsertMeetingEvaluation } from "./actions";
import {
  ADULT_ASPECTS,
  ADULT_ASPECT_DESCRIPTIONS,
  PREDICATES,
  type AdultAspect,
  type PredicateValue,
} from "@/lib/adult-rubric";

// ─── Attendance options ───────────────────────────────────────────────────────
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT",  label: "Hadir", icon: "✅", activeClass: "bg-emerald-500 text-white border-emerald-500" },
  { value: "EXCUSED",  label: "Izin",  icon: "📋", activeClass: "bg-yellow-400 text-white border-yellow-400" },
  { value: "SICK",     label: "Sakit", icon: "🤒", activeClass: "bg-amber-500  text-white border-amber-500"  },
  { value: "ABSENT",   label: "Alpa",  icon: "❌", activeClass: "bg-red-500    text-white border-red-500"    },
] as const;

type AttendanceValue = "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";

const PRED_COLORS: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-blue-500    text-white",
  C: "bg-yellow-400  text-white",
  D: "bg-orange-500  text-white",
  E: "bg-slate-400   text-white",
};

// ─── Component: Adult Aspect (Hardcoded) ──────────────────────────────────────────
function AspectPredicateSelect({
  aspect,
  value,
  onChange,
}: {
  aspect: AdultAspect;
  value: PredicateValue | "";
  onChange: (v: PredicateValue) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 leading-tight">{aspect}</p>
        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
          {ADULT_ASPECT_DESCRIPTIONS[aspect]}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        {PREDICATES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value as PredicateValue)}
            title={p.label}
            className={`w-8 h-8 rounded-lg text-xs font-black border-2 transition-all ${
              value === p.value
                ? PRED_COLORS[p.value] + " border-transparent scale-110 shadow-sm"
                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
            }`}
          >
            {p.value}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Component: Dynamic Aspect (rubricData) ─────────────────────────────────────────
function DynamicAspectSelect({
  aspectData,
  value,
  onChange,
}: {
  aspectData: any;
  value: PredicateValue | "";
  onChange: (v: PredicateValue) => void;
}) {
  const selectedDetails = value ? aspectData[value] : null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-700 leading-tight">{aspectData.aspectName}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {PREDICATES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value as PredicateValue)}
              title={p.label}
              className={`w-8 h-8 rounded-lg text-xs font-black border-2 transition-all ${
                value === p.value
                  ? PRED_COLORS[p.value] + " border-transparent scale-110 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              {p.value}
            </button>
          ))}
        </div>
      </div>
      
      {/* Dynamic Descriptions per aspect */}
      {selectedDetails && (selectedDetails.desc || selectedDetails.saran) && (
        <div className={`mt-1 p-2.5 rounded-lg border flex flex-col gap-1 text-xs ${
          value === "A" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
          value === "B" ? "bg-blue-50 border-blue-100 text-blue-800" :
          value === "C" ? "bg-yellow-50 border-yellow-100 text-yellow-800" :
          value === "D" ? "bg-orange-50 border-orange-100 text-orange-800" :
          "bg-slate-50 border-slate-200 text-slate-800"
        }`}>
          {selectedDetails.desc && (
            <p className="leading-relaxed"><strong>Deskripsi:</strong> {selectedDetails.desc}</p>
          )}
          {selectedDetails.saran && (
            <p className="leading-relaxed mt-0.5"><strong>Saran:</strong> {selectedDetails.saran}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type ExistingEval = {
  attendance?: string;
  predicate?: string | null;
  description?: string | null;
  suggestion?: string | null;
  aspectScores?: Record<string, string> | null;
  tutorNote?: string | null;
};

type Props = {
  studentId: string;
  studentName: string;
  meetingId: string;
  meetingLabel: string;
  programCategory?: string;
  programName?: string;
  meetingDesc?: {
    rubricData?: any[] | null;
  } | null;
  existingEval?: ExistingEval | null;
  onClose: () => void;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MeetingEvalForm({
  studentId,
  studentName,
  meetingId,
  meetingLabel,
  meetingDesc,
  programCategory,
  programName = "",
  existingEval,
  onClose,
}: Props) {
  const isAdultSpeak =
    programCategory === "ADULT" || programName.toLowerCase().includes("adult");

  const rubricData = Array.isArray(meetingDesc?.rubricData) && meetingDesc!.rubricData.length > 0 
    ? meetingDesc!.rubricData 
    : null;

  const isMultiAspect = !!rubricData || isAdultSpeak;

  // ── Attendance state ──
  const [attendance, setAttendance] = useState<AttendanceValue>(
    (existingEval?.attendance as AttendanceValue) || "PRESENT"
  );
  const isPresent = attendance === "PRESENT";

  // ── Kiddos Single Predicate Fields (Fallback) ──
  const [predicate, setPredicate]     = useState(existingEval?.predicate   || "");
  const [description, setDescription] = useState(existingEval?.description || "");
  const [suggestion, setSuggestion]   = useState(existingEval?.suggestion  || "");

  // ── Multi Aspect Fields ──
  const initAspects: Record<string, PredicateValue | ""> = {};
  if (rubricData) {
    rubricData.forEach((r: any) => {
      initAspects[r.aspectName] = ((existingEval?.aspectScores as any)?.[r.aspectName] as PredicateValue) || "";
    });
  } else if (isAdultSpeak) {
    ADULT_ASPECTS.forEach((asp) => {
      initAspects[asp] = ((existingEval?.aspectScores as any)?.[asp] as PredicateValue) || "";
    });
  }

  const [aspectScores, setAspectScores] = useState<Record<string, PredicateValue | "">>(initAspects);
  const [tutorNote, setTutorNote]       = useState(existingEval?.tutorNote || "");

  // ── Submission state ──
  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const aspectsFilled = Object.values(aspectScores).filter(Boolean).length;
  const totalAspects = rubricData ? rubricData.length : (isAdultSpeak ? ADULT_ASPECTS.length : 0);

  // ── Absent info ──
  const ABSENT_INFO: Record<string, string> = {
    EXCUSED: isAdultSpeak
      ? "Izin — Sesi mendapat ekstensi (Adult Speak)"
      : "Izin — Sesi Kiddos tetap hangus, tidak ada ekstensi",
    SICK: isAdultSpeak
      ? "Sakit — Sesi mendapat ekstensi (Adult Speak)"
      : "Sakit — Sesi Kiddos tetap hangus, tidak ada ekstensi",
    ABSENT: "Alpa — Tidak ada penilaian atau ekstensi",
  };

  // ── Submit helpers ──────────────────────────────────────────────────────────
  const buildPayload = (withScore: boolean) => ({
    studentId,
    meetingId,
    attendance,
    programCategory: isAdultSpeak ? "ADULT" : programCategory,
    // Only include score fields when "Simpan & Submit Nilai"
    predicate:    withScore && isPresent && !isMultiAspect ? predicate   : undefined,
    description:  withScore && isPresent && !isMultiAspect ? description : undefined,
    suggestion:   withScore && isPresent && !isMultiAspect ? suggestion  : undefined,
    aspectScores: withScore && isPresent && isMultiAspect
      ? Object.fromEntries(Object.entries(aspectScores).filter(([, v]) => v !== ""))
      : undefined,
    tutorNote:    withScore && isPresent ? tutorNote : undefined,
  });

  const submit = (withScore: boolean) => {
    // Validation only when submitting with score
    if (withScore && isPresent) {
      if (!isMultiAspect && !predicate) {
        setErrorMsg("Pilih predikat terlebih dahulu.");
        setStatus("error");
        return;
      }
      if (isMultiAspect && aspectsFilled === 0) {
        setErrorMsg("Nilai minimal satu aspek terlebih dahulu.");
        setStatus("error");
        return;
      }
    }
    setStatus("idle");
    startTransition(async () => {
      const res = await upsertMeetingEvaluation(buildPayload(withScore));
      if (res.success) {
        setStatus("success");
        setTimeout(onClose, 700);
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Gagal menyimpan.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meetingLabel}</p>
              {isAdultSpeak && (
                <span className="text-[9px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full">
                  ADULT SPEAK
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Evaluasi: {studentName}
            </h3>
            {existingEval && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                ✎ Edit evaluasi yang sudah ada
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* Status feedback */}
          {status === "success" && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
              <CheckCircle className="w-4 h-4 shrink-0" /> Berhasil disimpan!
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* ── Bagian 1: Toggle Presensi ── */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
              Status Kehadiran <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAttendance(opt.value as AttendanceValue)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-2 font-bold text-sm transition-all gap-1 ${
                    attendance === opt.value
                      ? opt.activeClass + " scale-105 shadow-md"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[10px] font-bold">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Chain Reaction info banner */}
            {isPresent && !existingEval && (
              <div className="mt-2.5 flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg">
                <Star className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                Murid hadir — isi nilai sekarang atau pilih <span className="font-black mx-0.5">"Isi Nanti"</span> jika sedang buru-buru.
              </div>
            )}

            {/* Absent info badge */}
            {!isPresent && ABSENT_INFO[attendance] && (
              <div className={`mt-2 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 ${
                isAdultSpeak && attendance !== "ABSENT"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {isAdultSpeak && attendance !== "ABSENT"
                  ? <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  : <UserX className="w-3.5 h-3.5 shrink-0" />}
                {ABSENT_INFO[attendance]}
              </div>
            )}
          </div>

          {/* ── Bagian 2A: MULTI-ASPECT EVALUATION ── */}
          {isPresent && isMultiAspect && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Rubrik Penilaian <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {aspectsFilled}/{totalAspects} aspek dinilai
                  </span>
                </div>
                
                <div className="space-y-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  {rubricData ? (
                    // Dynamic JSON Aspects
                    rubricData.map((aspectData: any) => (
                      <DynamicAspectSelect
                        key={aspectData.aspectName}
                        aspectData={aspectData}
                        value={aspectScores[aspectData.aspectName]}
                        onChange={(v) =>
                          setAspectScores((prev) => ({ ...prev, [aspectData.aspectName]: v }))
                        }
                      />
                    ))
                  ) : (
                    // Hardcoded Adult Aspects Fallback
                    ADULT_ASPECTS.map((aspect) => (
                      <AspectPredicateSelect
                        key={aspect}
                        aspect={aspect}
                        value={aspectScores[aspect]}
                        onChange={(v) =>
                          setAspectScores((prev) => ({ ...prev, [aspect]: v }))
                        }
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Tutor Note / Catatan Pelatih */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  Catatan Pelatih (Tutor Note)
                </label>
                <textarea
                  value={tutorNote}
                  onChange={(e) => setTutorNote(e.target.value)}
                  rows={4}
                  placeholder="Observasi umum, highlight performa, atau rekomendasi pengembangan..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                />
              </div>
            </>
          )}

          {/* ── Bagian 2B: SINGLE PREDICATE (Fallback if no JSON rubric and not adult) ── */}
          {isPresent && !isMultiAspect && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  Predikat Penilaian <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PREDICATES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPredicate(p.value)}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 font-black text-lg transition-all ${
                        predicate === p.value
                          ? PRED_COLORS[p.value] + " border-transparent scale-105 shadow-md"
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {p.value}
                    </button>
                  ))}
                </div>
                {predicate && (
                  <p className={`mt-2 text-xs font-bold px-3 py-1 rounded-full inline-block ${PRED_COLORS[predicate]}`}>
                    {PREDICATES.find((p) => p.value === predicate)?.label}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Deskripsi / Catatan Positif
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="cth: Murid sangat berani tampil, suara jelas dan vokal kuat..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Saran Perbaikan
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={2}
                  placeholder="cth: Perlu latihan eye contact dan gestur tangan..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                />
              </div>

              {/* Added Tutor Note for Fallback mode too so it matches user request for universal notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  Catatan Pelatih (Tutor Note)
                </label>
                <textarea
                  value={tutorNote}
                  onChange={(e) => setTutorNote(e.target.value)}
                  rows={3}
                  placeholder="Observasi umum tambahan..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* ── Footer — Action Buttons ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          {/* PRESENT: Dua tombol (Submit Nilai + Isi Nanti) */}
          {isPresent ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Defer button — simpan presensi saja, nilai null */}
              <button
                onClick={() => submit(false)}
                disabled={isPending || status === "success"}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition disabled:opacity-60 sm:order-1"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-orange-400" />
                )}
                Simpan Presensi Saja (Isi Nanti)
              </button>

              {/* Submit with score */}
              <button
                onClick={() => submit(true)}
                disabled={isPending || status === "success"}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60 sm:order-2 flex-1"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan &amp; Submit Nilai
              </button>
            </div>
          ) : (
            /* NOT PRESENT: Tombol tunggal standar */
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
              >
                Batal
              </button>
              <button
                onClick={() => submit(false)}
                disabled={isPending || status === "success"}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
