"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X, Search, ChevronDown, Loader2, CheckCircle,
  AlertTriangle, BookOpen, Info, Save, UserX,
} from "lucide-react";
import type { PendingSession } from "./pending-actions";
import {
  getCurriculumForProgram,
  getEvaluationsForStudents,
  getRubricDataForMeeting,
  getEnrolledStudentsForProgram,
} from "./eval-actions";
import { upsertMeetingEvaluation } from "../meeting-evaluations/actions";
import { formatMeetingOption, formatMeetingWithModule } from "@/lib/utils/meeting-format";

// ── Types ─────────────────────────────────────────────────────────────────────
type AttendanceValue = "PRESENT";
type Grade = "A" | "B" | "C" | "D" | "E";
type RubricAspect = { aspectName: string; [key: string]: any };
type Student = { id: string; name: string };

type StudentState = {
  attendance: AttendanceValue | null; // null = belum ditandai
  aspectScores: Record<string, Grade | "">;
  tutorNote: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADES = ["A", "B", "C", "D", "E"] as const;

const GRADE_ACTIVE: Record<string, string> = {
  A: "bg-emerald-500 text-white border-transparent shadow-sm",
  B: "bg-blue-500 text-white border-transparent shadow-sm",
  C: "bg-yellow-400 text-white border-transparent shadow-sm",
  D: "bg-orange-500 text-white border-transparent shadow-sm",
  E: "bg-rose-500 text-white border-transparent shadow-sm",
};

// ── AspectRow — inline rubric row ──────────────────────────────────────────────
function AspectRow({
  aspectName,
  value,
  onChange,
  disabled,
}: {
  aspectName: string;
  value: Grade | "";
  onChange: (v: Grade) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl">
      <p className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">
        {aspectName}
      </p>
      <div className="flex gap-1.5 shrink-0">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            disabled={disabled}
            className={`w-8 h-8 rounded-lg text-xs font-black border-2 transition-all disabled:cursor-not-allowed ${
              value === g
                ? GRADE_ACTIVE[g]
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

// ── StudentCard — inline attendance + rubric ───────────────────────────────────
function StudentCard({
  student,
  state,
  rubricAspects,
  onChange,
  isSubmitting,
}: {
  student: Student;
  state: StudentState;
  rubricAspects: RubricAspect[];
  onChange: (partial: Partial<StudentState>) => void;
  isSubmitting: boolean;
}) {
  const isPresent = state.attendance === "PRESENT";
  const isUnmarked = state.attendance === null;
  const filledCount = Object.values(state.aspectScores).filter(Boolean).length;
  const hasRubric = rubricAspects.length > 0;

  return (
    <div
      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
        isPresent
          ? "bg-white border-indigo-200 shadow-sm"
          : "bg-white border-slate-200" // unmarked = neutral
      }`}
    >
      {/* ── Student Header Row ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
            isPresent
              ? "bg-indigo-100 text-indigo-700"
              : isUnmarked
              ? "bg-slate-100 text-slate-500"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {student.name.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-slate-900 flex-1 min-w-[80px]">
          {student.name}
        </p>
        {isUnmarked && (
          <span className="text-[10px] font-semibold text-slate-400 italic mr-1">
            Belum ditandai
          </span>
        )}

        {/* Attendance toggle button */}
        <div className="flex gap-1 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => onChange({ attendance: isPresent ? null : "PRESENT" })}
            disabled={isSubmitting}
            title={isPresent ? "Batalkan Kehadiran" : "Tandai Hadir"}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
              isPresent
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="text-sm leading-none">✅</span>
            <span className="leading-none">Hadir</span>
          </button>
        </div>
      </div>

      {/* ── Rubric Section — ONLY when attendance is explicitly PRESENT ── */}
      {isPresent && (
        <div className="border-t border-indigo-100 px-4 pt-3 pb-4 bg-indigo-50/30 flex flex-col gap-2.5 transition-all duration-300 ease-in-out">
          {hasRubric ? (
            <>
              {/* Rubric header */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  Rubrik Penilaian
                </p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {filledCount}/{rubricAspects.length} aspek dinilai
                </span>
              </div>

              {/* Aspect rows */}
              <div className="flex flex-col gap-1.5">
                {rubricAspects.map((asp) => (
                  <AspectRow
                    key={asp.aspectName}
                    aspectName={asp.aspectName}
                    value={state.aspectScores[asp.aspectName] ?? ""}
                    onChange={(v) =>
                      onChange({
                        aspectScores: { ...state.aspectScores, [asp.aspectName]: v },
                      })
                    }
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Sesi ini tidak memiliki rubrik aspek. Kehadiran tetap tercatat.
            </div>
          )}

          {/* Catatan pelatih */}
          <textarea
            value={state.tutorNote}
            onChange={(e) => onChange({ tutorNote: e.target.value })}
            rows={2}
            placeholder="Catatan pelatih (opsional)..."
            disabled={isSubmitting}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 bg-white resize-none transition"
          />
        </div>
      )}


    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-none">
      <div className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm">
        <CheckCircle className="w-5 h-5 shrink-0" />
        {message}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function PendingEvalModal({
  session,
  onClose,
}: {
  session: PendingSession;
  onClose: () => void;
}) {
  const router = useRouter();

  // Curriculum
  const [modules, setModules] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");

  // Students + rubric
  const [students, setStudents] = useState<Student[]>([]);
  const [rubricAspects, setRubricAspects] = useState<RubricAspect[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Per-student state (attendance + scores + note)
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>({});

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Submission
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const [submitError, setSubmitError] = useState("");

  const isSingleModule = modules.length === 1;

  // Filtered students (search)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, searchQuery]);

  // ── Load curriculum ──
  useEffect(() => {
    getCurriculumForProgram(session.programId)
      .then(setModules)
      .finally(() => setLoadingCurriculum(false));
  }, [session.programId]);

  // ── Load students + rubric + existing evals when meeting selected ──
  useEffect(() => {
    if (!selectedMeetingId) {
      setStudents([]);
      setRubricAspects([]);
      setStudentStates({});
      setSearchQuery("");
      return;
    }
    setLoadingStudents(true);
    setStudentStates({});

    Promise.all([
      getEnrolledStudentsForProgram(session.programId),
      getRubricDataForMeeting(selectedMeetingId),
    ]).then(async ([enrolledStudents, rubric]) => {
      setStudents(enrolledStudents);

      // Parse rubric aspects
      const aspects: RubricAspect[] = Array.isArray(rubric)
        ? rubric.filter((r) => r?.aspectName)
        : [];
      setRubricAspects(aspects);

      // Fetch existing evals for pre-population
      const existingEvals =
        enrolledStudents.length > 0
          ? await getEvaluationsForStudents(
              enrolledStudents.map((s) => s.id),
              selectedMeetingId
            )
          : [];

      // Build initial state per student
      const initial: Record<string, StudentState> = {};
      for (const student of enrolledStudents) {
        const existing = existingEvals.find((e) => e.studentId === student.id);

        // Parse existing aspectScores
        let parsedScores: Record<string, Grade | ""> = {};
        if (existing?.aspectScores) {
          try {
            const raw =
              typeof existing.aspectScores === "string"
                ? JSON.parse(existing.aspectScores)
                : existing.aspectScores;
            parsedScores = raw as Record<string, Grade | "">;
          } catch {}
        }

        // Initialize all aspect keys (so new aspects show empty)
        const scores: Record<string, Grade | ""> = {};
        for (const asp of aspects) {
          scores[asp.aspectName] = (parsedScores[asp.aspectName] as Grade) || "";
        }

        // Initialize state — null for NEW students (unmarked by default)
        initial[student.id] = {
          attendance: (existing?.attendance as AttendanceValue) ?? null,
          aspectScores: scores,
          tutorNote: existing?.tutorNote || "",
        };
      }
      setStudentStates(initial);
      setLoadingStudents(false);
    });
  }, [selectedMeetingId, session.programId]);

  // ── Update one student's state ──
  const updateStudent = (studentId: string, partial: Partial<StudentState>) => {
    setStudentStates((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...partial },
    }));
  };

  // ── Bulk submit all students ──
  const handleSubmitAll = () => {
    setSubmitError("");
    // Only submit students who have been explicitly marked as PRESENT
    const markedStudents = students.filter((s) => studentStates[s.id]?.attendance === "PRESENT");
    if (markedStudents.length === 0) {
      setSubmitError("Tandai kehadiran minimal satu murid terlebih dahulu.");
      return;
    }
    startTransition(async () => {
      const results = await Promise.all(
        markedStudents.map((student) => {
          const state = studentStates[student.id];
          if (!state) return Promise.resolve({ success: true });

          const isPresent = state.attendance === "PRESENT";
          const filledScores = Object.fromEntries(
            Object.entries(state.aspectScores).filter(([, v]) => v !== "")
          );

          return upsertMeetingEvaluation({
            studentId: student.id,
            meetingId: selectedMeetingId,
            attendance: state.attendance!,
            programCategory: session.programCategory,
            aspectScores:
              isPresent && Object.keys(filledScores).length > 0
                ? (filledScores as Record<string, string>)
                : undefined,
            tutorNote: isPresent && state.tutorNote ? state.tutorNote : undefined,
          });
        })
      );

      const failed = results.filter((r) => !(r as any).success);
      if (failed.length > 0) {
        setSubmitError(`${failed.length} murid gagal disimpan. Silakan coba lagi.`);
      } else {
        setToast(`✅ ${markedStudents.length} evaluasi berhasil disimpan!`);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1400);
      }
    });
  };

  // ── Derived ──
  const selectedMeeting = (() => {
    for (const mod of modules) {
      const m = mod.meetings?.find((mt: any) => mt.id === selectedMeetingId);
      if (m) return { module: mod, meeting: m };
    }
    return null;
  })();

  const presentCount = students.filter(
    (s) => studentStates[s.id]?.attendance === "PRESENT"
  ).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[93vh] flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">

          {/* ── Header ── */}
          <div className="shrink-0 flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex flex-col gap-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  ⚠️ Tanggungan Presensi
                </span>
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  📅 {session.sessionDateFormatted}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate">{session.className}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {session.programName} · {session.timeSlot}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition shrink-0 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 flex flex-col gap-5">

              {/* Step 1: Pilih Materi */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  1. Pilih Materi yang Diajarkan
                </label>

                {loadingCurriculum ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat kurikulum...
                  </div>
                ) : modules.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Belum ada kurikulum untuk program ini.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedMeetingId}
                      onChange={(e) => setSelectedMeetingId(e.target.value)}
                      disabled={isPending}
                      className="w-full appearance-none bg-white border border-indigo-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm transition disabled:opacity-50"
                    >
                      <option value="">
                        {session.programCategory !== "KIDDOS" ? "— Pilih Materi —" : "— Pilih Pertemuan —"}
                      </option>
                      {isSingleModule
                        ? modules[0].meetings?.map((meet: any) => (
                            <option key={meet.id} value={meet.id}>
                              {formatMeetingOption(session.programCategory, meet.meetingNumber, meet.material, meet.isPerformance)}
                            </option>
                          ))
                        : modules.map((mod) => (
                            <optgroup key={mod.id} label={`Modul ${mod.moduleNumber}: ${mod.title}`}>
                              {mod.meetings?.map((meet: any) => (
                                <option key={meet.id} value={meet.id}>
                                  {formatMeetingOption(session.programCategory, meet.meetingNumber, meet.material, meet.isPerformance)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Step 2: Student List */}
              {selectedMeetingId && (
                <div className="flex flex-col gap-3">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                      2. Kehadiran &amp; Penilaian Murid
                    </p>
                    {!loadingStudents && students.length > 0 && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        presentCount > 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {presentCount} Murid Ditandai Hadir
                      </span>
                    )}
                  </div>

                  {loadingStudents ? (
                    <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Memuat daftar murid...</span>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Tidak ada murid aktif yang terdaftar di kelas ini.
                    </div>
                  ) : (
                    <>
                      {/* ── Search Bar (sticky) ── */}
                      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-1 pb-2 -mx-6 px-6">
                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                          <Search className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Cari dari ${students.length} murid...`}
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {searchQuery.trim() && (
                            <span className="text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-2.5 shrink-0">
                              {filteredStudents.length} hasil
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Student Cards ── */}
                      {filteredStudents.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-400">
                          Tidak ada murid dengan nama &ldquo;{searchQuery}&rdquo;.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {filteredStudents.map((student) => (
                            <StudentCard
                              key={student.id}
                              student={student}
                              state={
                                studentStates[student.id] ?? {
                                  attendance: "PRESENT",
                                  aspectScores: {},
                                  tutorNote: "",
                                }
                              }
                              rubricAspects={rubricAspects}
                              onChange={(partial) => updateStudent(student.id, partial)}
                              isSubmitting={isPending}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Placeholder when no meeting selected */}
              {!selectedMeetingId && !loadingCurriculum && modules.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <Info className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400 text-center max-w-xs">
                    Pilih materi yang diajarkan pada sesi ini untuk memulai pengisian presensi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Sticky Footer — Submit All ── */}
          {selectedMeetingId && (
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
              {submitError && (
                <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {submitError}
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  <span className="text-emerald-700 font-bold">{presentCount}</span> murid ditandai hadir
                </div>
                <button
                  onClick={handleSubmitAll}
                  disabled={isPending || presentCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isPending ? "Menyimpan..." : `Simpan (${presentCount} Murid)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </>
  );
}
