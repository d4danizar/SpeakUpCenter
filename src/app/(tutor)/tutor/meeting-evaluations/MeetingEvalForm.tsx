"use client";

import { useState, useTransition } from "react";
import {
  Star, Save, Loader2, X, CheckCircle, AlertTriangle,
  UserCheck, UserX, MessageSquare, Info, Clock,
} from "lucide-react";
import { upsertMeetingEvaluation } from "./actions";

// ─── Attendance options ───────────────────────────────────────────────────────
const ATTENDANCE_OPTIONS = [
  { value: "PRESENT",  label: "Hadir", icon: "✅", activeClass: "bg-emerald-500 text-white border-emerald-500" },
  { value: "EXCUSED",  label: "Izin",  icon: "📋", activeClass: "bg-yellow-400 text-white border-yellow-400" },
  { value: "SICK",     label: "Sakit", icon: "🤒", activeClass: "bg-amber-500  text-white border-amber-500"  },
  { value: "ABSENT",   label: "Alpa",  icon: "❌", activeClass: "bg-red-500    text-white border-red-500"    },
] as const;

type AttendanceValue = "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";

// ─── Grade button colors ──────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500 text-white border-transparent scale-110 shadow-sm",
  B: "bg-blue-500    text-white border-transparent scale-110 shadow-sm",
  C: "bg-yellow-400  text-white border-transparent scale-110 shadow-sm",
  D: "bg-orange-500  text-white border-transparent scale-110 shadow-sm",
  E: "bg-rose-500    text-white border-transparent scale-110 shadow-sm",
};
const GRADES = ["A", "B", "C", "D", "E"] as const;
type Grade = typeof GRADES[number];

// ─── Single Aspect Row ────────────────────────────────────────────────────────
function AspectRow({
  aspectName,
  value,
  onChange,
}: {
  aspectName: string;
  value: Grade | "";
  onChange: (v: Grade) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
      <p className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">
        {aspectName}
      </p>
      <div className="flex gap-1.5 shrink-0">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`w-8 h-8 rounded-lg text-xs font-black border-2 transition-all ${
              value === g
                ? GRADE_COLORS[g]
                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type RubricAspect = {
  aspectName: string;
  [key: string]: any;
};

type ExistingEval = {
  attendance?: string;
  aspectScores?: Record<string, string> | null;
  tutorNote?: string | null;
  // legacy fields kept for backward read-only compat
  predicate?: string | null;
  description?: string | null;
  suggestion?: string | null;
};

type Props = {
  studentId: string;
  studentName: string;
  meetingId: string;
  meetingLabel: string;
  programCategory?: string;
  programName?: string;
  meetingDesc?: {
    rubricData?: RubricAspect[] | null;
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
  // Parse rubricData — robust: handles already-array, JSON string, or null
  const rawRubric = meetingDesc?.rubricData;
  let rubricAspects: RubricAspect[] = [];
  if (Array.isArray(rawRubric)) {
    rubricAspects = rawRubric;
  } else if (typeof rawRubric === "string" && (rawRubric as string).startsWith("[")) {
    try { rubricAspects = JSON.parse(rawRubric); } catch { rubricAspects = []; }
  } else if (rawRubric && typeof rawRubric === "object") {
    // Single object wrapped — shouldn't happen but guard it
    rubricAspects = [rawRubric as unknown as RubricAspect];
  }
  // Keep only items that have a valid aspectName
  rubricAspects = rubricAspects.filter(
    (r) => r && typeof r === "object" && typeof r.aspectName === "string" && r.aspectName.trim()
  );

  const hasRubric = rubricAspects.length > 0;

  // ── Attendance state ──
  const [attendance, setAttendance] = useState<AttendanceValue>(
    (existingEval?.attendance as AttendanceValue) || "PRESENT"
  );
  const isPresent = attendance === "PRESENT";

  // ── Aspect scores state — keyed by aspectName ──
  const initScores: Record<string, Grade | ""> = {};
  for (const asp of rubricAspects) {
    initScores[asp.aspectName] =
      ((existingEval?.aspectScores as any)?.[asp.aspectName] as Grade) || "";
  }
  const [aspectScores, setAspectScores] = useState<Record<string, Grade | "">>(initScores);

  // ── Tutor note ──
  const [tutorNote, setTutorNote] = useState(existingEval?.tutorNote || "");

  // ── Submission state ──
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const filledCount = Object.values(aspectScores).filter(Boolean).length;
  const totalAspects = rubricAspects.length;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = (withScore: boolean) => {
    if (withScore && isPresent && hasRubric && filledCount === 0) {
      setErrorMsg("Nilai minimal satu aspek terlebih dahulu.");
      setStatus("error");
      return;
    }
    setStatus("idle");
    setErrorMsg("");

    startTransition(async () => {
      const payload = {
        studentId,
        meetingId,
        attendance,
        programCategory,
        // Unified: ALL programs send aspectScores JSON
        aspectScores:
          withScore && isPresent && hasRubric
            ? Object.fromEntries(
                Object.entries(aspectScores).filter(([, v]) => v !== "")
              ) as Record<string, string>
            : undefined,
        tutorNote: withScore && isPresent ? tutorNote : undefined,
      };

      const res = await upsertMeetingEvaluation(payload);
      if (res.success) {
        setStatus("success");
        setTimeout(onClose, 700);
      } else {
        setStatus("error");
        setErrorMsg((res as any).error || "Gagal menyimpan.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {meetingLabel}
            </p>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <Star className="w-4 h-4 text-amber-500" />
              Evaluasi: {studentName}
            </h3>
            {existingEval && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                ✎ Edit evaluasi yang sudah ada
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

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

          {/* ── Bagian 1: Toggle Kehadiran ── */}
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

            {/* Info banner absent */}
            {!isPresent && (
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                <UserX className="w-3.5 h-3.5 shrink-0" />
                Murid tidak hadir — nilai tidak akan diisi.
              </div>
            )}
            {isPresent && !existingEval && (
              <div className="mt-2.5 flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg">
                <Star className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                Murid hadir — isi nilai sekarang atau pilih{" "}
                <span className="font-black mx-0.5">"Isi Nanti"</span> jika sedang buru-buru.
              </div>
            )}
          </div>

          {/* ── Bagian 2: Aspek Penilaian (Unified Dynamic JSON) ── */}
          {isPresent && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {hasRubric ? (
                      <>Rubrik Penilaian <span className="text-red-500">*</span></>
                    ) : (
                      "Rubrik Penilaian"
                    )}
                  </label>
                  {hasRubric && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {filledCount}/{totalAspects} aspek dinilai
                    </span>
                  )}
                </div>

                {hasRubric ? (
                  <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    {rubricAspects.map((asp) => (
                      <AspectRow
                        key={asp.aspectName}
                        aspectName={asp.aspectName}
                        value={aspectScores[asp.aspectName] ?? ""}
                        onChange={(v) =>
                          setAspectScores((prev) => ({ ...prev, [asp.aspectName]: v }))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  /* Pertemuan tanpa rubrik (Perform di Mall, Competition, dll) */
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-3 rounded-xl">
                    <Info className="w-4 h-4 shrink-0" />
                    Pertemuan ini tidak memiliki rubrik penilaian aspek.
                    Kamu tetap bisa menyimpan kehadiran dan catatan pelatih di bawah.
                  </div>
                )}
              </div>

              {/* ── Catatan Pelatih (universal) ── */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  Catatan Pelatih <span className="text-slate-400 font-normal">(Opsional)</span>
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
        </div>

        {/* ── Footer — Action Buttons ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          {isPresent ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Defer — simpan presensi saja */}
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

              {/* Submit dengan nilai */}
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
                {isPending ? "Menyimpan..." : "Simpan Kehadiran"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
