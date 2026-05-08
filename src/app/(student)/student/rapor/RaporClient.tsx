"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, BookOpen, Star } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type AspectScore = Record<string, string>; // { "Keberanian Tampil": "A", ... }

type RubricAspect = {
  aspectName: string;
  A?: { desc?: string; saran?: string };
  B?: { desc?: string; saran?: string };
  C?: { desc?: string; saran?: string };
  D?: { desc?: string; saran?: string };
  E?: { desc?: string; saran?: string };
};

type MeetingEval = {
  attendance: string;
  predicate?: string | null;
  description?: string | null;
  suggestion?: string | null;
  aspectScores?: AspectScore | null;
  tutorNote?: string | null;
  createdAt: string;
};

type Meeting = {
  id: string;
  meetingNumber: number;
  material: string;
  isPerformance: boolean;
  rubricData?: RubricAspect[] | null;
  meetingEvaluations: MeetingEval[];
};

type Module = {
  id: string;
  moduleNumber: number;
  title: string;
  description?: string | null;
  meetings: Meeting[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500 text-white border-emerald-600 shadow-emerald-200",
  B: "bg-blue-500 text-white border-blue-600 shadow-blue-200",
  C: "bg-amber-400 text-white border-amber-500 shadow-amber-200",
  D: "bg-orange-500 text-white border-orange-600 shadow-orange-200",
  E: "bg-rose-500 text-white border-rose-600 shadow-rose-200",
};

const GRADE_BG_LIGHT: Record<string, string> = {
  A: "bg-emerald-50 border-emerald-200",
  B: "bg-blue-50 border-blue-200",
  C: "bg-amber-50 border-amber-200",
  D: "bg-orange-50 border-orange-200",
  E: "bg-rose-50 border-rose-200",
};

const GRADE_TEXT: Record<string, string> = {
  A: "text-emerald-700",
  B: "text-blue-700",
  C: "text-amber-700",
  D: "text-orange-700",
  E: "text-rose-700",
};

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black border shadow-sm ${GRADE_COLORS[grade] || "bg-slate-200 text-slate-600 border-slate-300"}`}
    >
      {grade}
    </span>
  );
}

function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    PRESENT: {
      label: "Hadir",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    ABSENT: {
      label: "Alpa",
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
    SICK: {
      label: "Sakit",
      icon: <Clock className="w-3.5 h-3.5" />,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    EXCUSED: {
      label: "Izin",
      icon: <Clock className="w-3.5 h-3.5" />,
      cls: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const config = map[status] ?? { label: status, icon: null, cls: "bg-slate-100 text-slate-500 border-slate-200" };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

// ── Komponen Nilai Satu Pertemuan ──────────────────────────────────────────────

function MeetingEvalCard({
  meeting,
  isOpen,
  onToggle,
}: {
  meeting: Meeting;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const eval_ = meeting.meetingEvaluations[0] ?? null;
  const hasEval = !!eval_;
  const isPresent = eval_?.attendance === "PRESENT";

  // Parse aspectScores JSON safely
  let aspectScores: AspectScore | null = null;
  if (eval_?.aspectScores) {
    try {
      aspectScores =
        typeof eval_.aspectScores === "string"
          ? JSON.parse(eval_.aspectScores)
          : (eval_.aspectScores as AspectScore);
    } catch {
      aspectScores = null;
    }
  }

  // Parse rubricData JSON safely
  let rubricData: RubricAspect[] | null = null;
  if (meeting.rubricData) {
    try {
      rubricData =
        typeof meeting.rubricData === "string"
          ? JSON.parse(meeting.rubricData)
          : (meeting.rubricData as RubricAspect[]);
    } catch {
      rubricData = null;
    }
  }

  const hasAspectScores = aspectScores && Object.keys(aspectScores).length > 0;
  const hasKiddosScore = !!eval_?.predicate;

  // Summary grade for collapsed view
  const summaryGrades = hasAspectScores
    ? Object.values(aspectScores!).slice(0, 3)
    : hasKiddosScore
    ? [eval_!.predicate!]
    : [];

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        hasEval && isPresent
          ? "border-indigo-200 bg-white shadow-sm"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      {/* Header Row (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors"
      >
        {/* Meeting number circle */}
        <div
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black border ${
            meeting.isPerformance
              ? "bg-violet-100 text-violet-700 border-violet-200"
              : hasEval && isPresent
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-slate-200 text-slate-500 border-slate-300"
          }`}
        >
          {meeting.isPerformance ? "★" : meeting.meetingNumber}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {meeting.isPerformance ? "Performance" : `Pertemuan ${meeting.meetingNumber}`}
          </p>
          <p className="text-xs text-slate-400 truncate leading-snug">
            {meeting.material || "—"}
          </p>
        </div>

        {/* Right side: attendance badge OR grade previews */}
        <div className="flex items-center gap-2 shrink-0">
          {hasEval ? (
            <>
              <AttendanceBadge status={eval_!.attendance} />
              {isPresent && summaryGrades.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {summaryGrades.map((g, i) => (
                    <GradeBadge key={i} grade={g} />
                  ))}
                  {hasAspectScores && Object.keys(aspectScores!).length > 3 && (
                    <span className="text-xs text-slate-400 font-bold">
                      +{Object.keys(aspectScores!).length - 3}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400 font-semibold italic">Belum dinilai</span>
          )}
          <div className="text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Detail Panel */}
      {isOpen && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-white">
          {!hasEval ? (
            <p className="text-sm text-slate-400 italic text-center py-4">
              Tutor belum mengisi penilaian untuk pertemuan ini.
            </p>
          ) : !isPresent ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>
                Murid tidak hadir pada pertemuan ini (
                {eval_!.attendance === "SICK" ? "Sakit" : eval_!.attendance === "EXCUSED" ? "Izin" : "Alpa"}).
              </span>
            </div>
          ) : hasAspectScores ? (
            /* ── Adult Speak: Multi-Aspek JSON ── */
            <div className="space-y-3">
              {Object.entries(aspectScores!).map(([aspectName, grade]) => {
                // Cari rubrik untuk aspek ini
                const rubricAspect = rubricData?.find(
                  (r) => r.aspectName?.toLowerCase() === aspectName.toLowerCase()
                );
                const rubricForGrade = rubricAspect?.[grade as keyof RubricAspect] as
                  | { desc?: string; saran?: string }
                  | undefined;

                return (
                  <div
                    key={aspectName}
                    className={`rounded-xl border p-3 ${GRADE_BG_LIGHT[grade] || "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <GradeBadge grade={grade} />
                      <span className={`font-bold text-sm ${GRADE_TEXT[grade] || "text-slate-700"}`}>
                        {aspectName}
                      </span>
                    </div>

                    {rubricForGrade?.desc && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed pl-1">
                        📝 <span className="font-semibold">Deskripsi:</span>{" "}
                        {rubricForGrade.desc}
                      </p>
                    )}
                    {rubricForGrade?.saran && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed pl-1">
                        💡 <span className="font-semibold">Saran:</span>{" "}
                        {rubricForGrade.saran}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Tutor Note */}
              {eval_!.tutorNote && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> Catatan Tutor
                  </p>
                  <p className="text-sm text-amber-800 italic leading-relaxed">
                    &ldquo;{eval_!.tutorNote}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : hasKiddosScore ? (
            /* ── Kiddos: Single Predicate + desc + suggestion ── */
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GradeBadge grade={eval_!.predicate!} />
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Nilai Predikat:{" "}
                    <span className={GRADE_TEXT[eval_!.predicate!] || "text-slate-700"}>
                      {eval_!.predicate}
                    </span>
                  </p>
                </div>
              </div>

              {eval_!.description && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-700 mb-1">✅ Catatan Positif</p>
                  <p className="text-sm text-emerald-800 leading-relaxed">{eval_!.description}</p>
                </div>
              )}
              {eval_!.suggestion && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 mb-1">💡 Saran Perbaikan</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{eval_!.suggestion}</p>
                </div>
              )}
            </div>
          ) : (
            /* PRESENT but no score yet (defer mode) */
            <p className="text-sm text-slate-400 italic text-center py-3">
              Hadir, namun nilai belum diisi oleh Tutor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────────

export default function RaporClient({
  modules,
  programCategory,
}: {
  modules: Module[];
  programCategory: string;
}) {
  // Track which meeting is open (by meeting id)
  const [openMeetingId, setOpenMeetingId] = useState<string | null>(null);
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    modules?.[0]?.id ?? null // Auto-expand first module
  );

  const toggleMeeting = (id: string) =>
    setOpenMeetingId((prev) => (prev === id ? null : id));

  const toggleModule = (id: string) =>
    setOpenModuleId((prev) => (prev === id ? null : id));

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-base font-bold">Kurikulum belum tersedia.</p>
        <p className="text-sm mt-1">Hubungi Admin untuk menambahkan modul.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((mod) => {
        const isModOpen = openModuleId === mod.id;

        // Hitung statistik modul
        const totalMeetings = mod.meetings.length;
        const evaluated = mod.meetings.filter(
          (m) => m.meetingEvaluations.length > 0 && m.meetingEvaluations[0].attendance === "PRESENT"
        ).length;

        return (
          <div
            key={mod.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors"
            >
              {/* Module number */}
              <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                {mod.moduleNumber}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base leading-tight">
                  {mod.title || `Modul ${mod.moduleNumber}`}
                </p>
                {mod.description && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                    {mod.description}
                  </p>
                )}
              </div>

              {/* Progress badge */}
              <div className="shrink-0 flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-slate-400 font-semibold">Progress</p>
                  <p className="text-sm font-black text-indigo-600">
                    {evaluated}/{totalMeetings}
                  </p>
                </div>

                {/* Mini progress bar */}
                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: totalMeetings > 0 ? `${(evaluated / totalMeetings) * 100}%` : "0%",
                    }}
                  />
                </div>

                <div className="text-slate-400">
                  {isModOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Meeting list */}
            {isModOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                {mod.meetings.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">
                    Belum ada pertemuan di modul ini.
                  </p>
                ) : (
                  mod.meetings.map((meeting) => (
                    <MeetingEvalCard
                      key={meeting.id}
                      meeting={meeting}
                      isOpen={openMeetingId === meeting.id}
                      onToggle={() => toggleMeeting(meeting.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Keterangan Nilai
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { grade: "A", label: "Sangat Baik" },
            { grade: "B", label: "Baik" },
            { grade: "C", label: "Cukup" },
            { grade: "D", label: "Perlu Latihan" },
            { grade: "E", label: "Perlu Perhatian" },
          ].map(({ grade, label }) => (
            <div key={grade} className="flex items-center gap-2">
              <GradeBadge grade={grade} />
              <span className="text-xs text-slate-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
