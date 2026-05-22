"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ChevronDown, Users, Loader2, Edit2, CheckCircle,
  Clock, XCircle, Info, BookOpen,
} from "lucide-react";
import { getClassesWithModules, getMeetingStudentEvals, getRubricDataForMeeting } from "./actions";
import MeetingEvalForm from "../meeting-evaluations/MeetingEvalForm";
import { formatMeetingOption, formatMeetingWithModule } from "@/lib/utils/meeting-format";

// ─── Types ────────────────────────────────────────────────────────────────────

type RubricAspect = {
  aspectName: string;
  A?: { desc?: string; saran?: string };
  B?: { desc?: string; saran?: string };
  C?: { desc?: string; saran?: string };
  D?: { desc?: string; saran?: string };
  E?: { desc?: string; saran?: string };
};

type Meeting = {
  id: string;
  meetingNumber: number;
  material: string;
  isPerformance: boolean;
  rubricData?: RubricAspect[] | null;
};

type Module = {
  id: string;
  moduleNumber: number;
  title: string;
  meetings: Meeting[];
};

type ProgramClass = {
  id: string;
  name: string;
  category: string;
  modules: Module[];
};

type StudentRow = {
  id: string;
  name: string;
  eval: {
    attendance?: string;
    predicate?: string | null;
    description?: string | null;
    suggestion?: string | null;
    aspectScores?: Record<string, string> | null;
    tutorNote?: string | null;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ATTENDANCE_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PRESENT:  { label: "Hadir",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
  ABSENT:   { label: "Alpa",   cls: "bg-rose-50 text-rose-700 border-rose-200",         icon: <XCircle    className="w-3 h-3" /> },
  SICK:     { label: "Sakit",  cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: <Clock      className="w-3 h-3" /> },
  EXCUSED:  { label: "Izin",   cls: "bg-slate-100 text-slate-600 border-slate-200",      icon: <Clock      className="w-3 h-3" /> },
};

const GRADE_DOT: Record<string, string> = {
  A: "bg-emerald-500", B: "bg-blue-500", C: "bg-amber-400", D: "bg-orange-500", E: "bg-rose-500",
};

function ScoreSummary({ scores, predicate }: { scores?: Record<string, string> | null; predicate?: string | null }) {
  if (scores && Object.keys(scores).length > 0) {
    const vals = Object.values(scores).slice(0, 4);
    return (
      <div className="flex gap-1 flex-wrap">
        {vals.map((g, i) => (
          <span key={i} className={`w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center ${GRADE_DOT[g] ?? "bg-slate-400"}`}>{g}</span>
        ))}
        {Object.keys(scores).length > 4 && <span className="text-[10px] text-slate-400 self-center">+{Object.keys(scores).length - 4}</span>}
      </div>
    );
  }
  if (predicate) {
    return <span className={`w-7 h-7 rounded-lg text-sm font-black text-white flex items-center justify-center ${GRADE_DOT[predicate] ?? "bg-slate-400"}`}>{predicate}</span>;
  }
  return <span className="text-xs text-slate-400 italic">—</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EvaluationsClient({ tutorId }: { tutorId: string }) {
  const [classes, setClasses] = useState<ProgramClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState("");

  // Live rubricData fetched fresh from DB when meeting is selected
  const [liveRubricData, setLiveRubricData] = useState<any[] | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modal edit state
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);

  // Track rubric loading state separately for UI blocking
  const [loadingRubric, setLoadingRubric] = useState(false);

  // ── Load classes on mount ──
  useEffect(() => {
    getClassesWithModules().then((res) => {
      setClasses(res);
      setLoadingClasses(false);
    });
  }, []);

  // ── Load student evals + rubricData when meeting changes ──
  useEffect(() => {
    if (!selectedMeetingId || !selectedClassId) {
      setStudents([]);
      setLiveRubricData(null);
      return;
    }
    setLoadingStudents(true);
    setLoadingRubric(true);
    setLiveRubricData(null);
    // Fetch both in parallel
    Promise.all([
      getMeetingStudentEvals(selectedMeetingId, selectedClassId),
      getRubricDataForMeeting(selectedMeetingId),
    ]).then(([rows, rubric]) => {
      setStudents(rows);
      setLiveRubricData(rubric);
      setLoadingStudents(false);
      setLoadingRubric(false);
    }).catch(() => {
      setLoadingStudents(false);
      setLoadingRubric(false);
    });
  }, [selectedMeetingId, selectedClassId]);

  // ── Derived data ──
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Find selected meeting object (metadata only — rubricData comes from liveRubricData)
  let selectedMeeting: Meeting | null = null;
  if (selectedClass && selectedMeetingId) {
    for (const mod of selectedClass.modules) {
      const m = mod.meetings.find((mt) => mt.id === selectedMeetingId);
      if (m) { selectedMeeting = m; break; }
    }
  }

  // Build meetingDesc with LIVE rubricData (not stale state)
  const meetingDesc = selectedMeeting
    ? { ...selectedMeeting, rubricData: liveRubricData }
    : null;

  // Find module title for selected meeting
  let selectedModuleTitle = "";
  if (selectedClass && selectedMeetingId) {
    for (const mod of selectedClass.modules) {
      if (mod.meetings.find((mt) => mt.id === selectedMeetingId)) {
        selectedModuleTitle = mod.title;
        break;
      }
    }
  }

  const meetingLabel = selectedMeeting
    ? formatMeetingWithModule(selectedClass?.category, selectedModuleTitle, selectedMeeting.meetingNumber, selectedMeeting.material, selectedMeeting.isPerformance)
    : "";

  const totalStudents = students.length;
  const dinilai = students.filter(
    (s) => s.eval && (s.eval.predicate || (s.eval.aspectScores && Object.keys(s.eval.aspectScores).length > 0))
  ).length;

  const refreshStudents = () => {
    if (!selectedMeetingId || !selectedClassId) return;
    setLoadingStudents(true);
    getMeetingStudentEvals(selectedMeetingId, selectedClassId).then((res) => {
      setStudents(res);
      setLoadingStudents(false);
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto pb-16">

      {/* ── Filter Bar ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Nilai per Pertemuan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Pilih Kelas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Kelas / Program</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedMeetingId(""); setStudents([]); }}
                disabled={loadingClasses}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">— Pilih Kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {loadingClasses ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>
          </div>

          {/* 2. Pilih Modul & Pertemuan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Modul & Pertemuan</label>
            <div className="relative">
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                disabled={!selectedClassId || !selectedClass?.modules.length}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">{selectedClass?.category && (selectedClass.category !== "KIDDOS") ? "— Pilih Materi —" : "— Pilih Pertemuan —"}</option>
                {selectedClass?.modules.map((mod) => (
                  <optgroup key={mod.id} label={`Modul ${mod.moduleNumber}: ${mod.title}`}>
                    {mod.meetings.map((meet) => (
                      <option key={meet.id} value={meet.id}>
                        {formatMeetingOption(selectedClass.category, meet.meetingNumber, meet.material, meet.isPerformance)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Table ── */}
      {selectedMeetingId ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{meetingLabel}</p>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                <Users className="w-4 h-4 text-indigo-400" />
                {totalStudents} Murid Terdaftar
                {!loadingStudents && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {dinilai}/{totalStudents} Dinilai
                  </span>
                )}
              </h3>
            </div>

            {/* Progress bar */}
            {!loadingStudents && totalStudents > 0 && (
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(dinilai / totalStudents) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{Math.round((dinilai / totalStudents) * 100)}%</span>
              </div>
            )}
          </div>

          {loadingStudents ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Memuat data murid...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada murid yang terdaftar di kelas ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Murid</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kehadiran</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Aspek</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student, idx) => {
                    const att = student.eval?.attendance;
                    const attCfg = att ? ATTENDANCE_BADGE[att] : null;
                    const hasScore = !!(
                      student.eval?.predicate ||
                      (student.eval?.aspectScores && Object.keys(student.eval.aspectScores).length > 0)
                    );

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{student.name}</span>
                            {hasScore && (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                ✓ Dinilai
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {attCfg ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${attCfg.cls}`}>
                              {attCfg.icon} {attCfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <ScoreSummary scores={student.eval?.aspectScores} predicate={student.eval?.predicate} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setEditStudent(student)}
                            disabled={loadingRubric}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-wait"
                          >
                            {loadingRubric
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...</>
                              : <><Edit2 className="w-3.5 h-3.5" /> {student.eval ? "Edit" : "Isi Nilai"}</>
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 flex flex-col items-center justify-center text-center">
          <Info className="w-10 h-10 text-slate-200 mb-3" />
          <h3 className="text-sm font-bold text-slate-600 mb-1">Pilih Kelas & Pertemuan</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Pilih kelas dan pertemuan di atas untuk melihat daftar murid dan status penilaian mereka.
          </p>
        </div>
      )}

      {/* ── Edit Modal — reuses MeetingEvalForm ── */}
      {editStudent && meetingDesc && selectedClass && (
        <MeetingEvalForm
          key={`${editStudent.id}-${selectedMeetingId}-${liveRubricData?.length ?? 0}`}
          studentId={editStudent.id}
          studentName={editStudent.name}
          meetingId={selectedMeetingId}
          meetingLabel={meetingLabel}
          meetingDesc={meetingDesc}
          programCategory={selectedClass.category}
          programName={selectedClass.name}
          existingEval={editStudent.eval ?? undefined}
          onClose={async () => {
            setEditStudent(null);
            refreshStudents();
          }}
        />
      )}
    </div>
  );
}
