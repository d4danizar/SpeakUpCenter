"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronRight, Star, Users,
  Trophy, CheckCircle2, Clock, Search, X,
} from "lucide-react";
import MeetingEvalForm from "./MeetingEvalForm";
import { getExistingEvaluation } from "./actions";

type Meeting = {
  id: string;
  meetingNumber: number;
  material: string;
  isPerformance: boolean;
  meetingEvaluations: { studentId: string; predicate: string }[];
};

type Module = {
  id: string;
  moduleNumber: number;
  title: string;
  isActive: boolean;
  meetings: Meeting[];
};

type Student = { id: string; name: string };

const PREDICATE_COLORS: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-yellow-400 text-white",
  D: "bg-orange-500 text-white",
  E: "bg-slate-400 text-white",
};

type EvalFormState = {
  studentId: string;
  studentName: string;
  meetingId: string;
  meetingLabel: string;
  existingEval: { predicate: string; description?: string | null; suggestion?: string | null } | null;
} | null;

export default function MeetingEvaluationsClient({
  modules,
  students,
  programName,
  programCategory,
}: {
  modules: Module[];
  students: Student[];
  programName: string;
  programCategory?: string; // "KIDDOS" | "ADULT" | dll
}) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [openMeetings, setOpenMeetings] = useState<Set<string>>(new Set());
  const [evalForm, setEvalForm] = useState<EvalFormState>(null);
  const [loadingEval, setLoadingEval] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter murid berdasarkan searchQuery (case-insensitive)
  const filteredStudents = searchQuery.trim()
    ? students.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleMeeting = (id: string) => {
    setOpenMeetings((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const openEvalForm = async (student: Student, meeting: Meeting, moduleTitle: string, moduleNumber: number) => {
    const key = `${student.id}-${meeting.id}`;
    setLoadingEval(key);
    const existing = await getExistingEvaluation(student.id, meeting.id);
    setLoadingEval(null);
    setEvalForm({
      studentId: student.id,
      studentName: student.name,
      meetingId: meeting.id,
      meetingLabel: `${moduleTitle} — Pertemuan ${meeting.meetingNumber}`,
      existingEval: existing ?? null,
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Search Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama murid..."
          className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-500 border-l border-slate-200 pl-3">
          <Users className="w-3.5 h-3.5" />
          {searchQuery.trim()
            ? <span><strong className="text-indigo-600">{filteredStudents.length}</strong>/{students.length} murid</span>
            : <span>{students.length} murid</span>
          }
        </div>
      </div>

      {/* Program Badge */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-bold text-slate-700">{programName}</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
          {modules.length} Modul
        </span>
        <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
          {students.length} Murid
        </span>
      </div>

      {/* Module Accordion */}
      {modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada kurikulum untuk program ini.</p>
          <p className="text-xs text-slate-400 mt-1">Generate kurikulum di halaman Kelola Program terlebih dahulu.</p>
        </div>
      )}

      {modules.map((mod) => {
        const isModOpen = openModules.has(mod.id);
        // Hitung progress berdasarkan filteredStudents (mengikuti filter search)
        const totalEvals = mod.meetings.reduce(
          (a, m) => a + m.meetingEvaluations.filter((e) => filteredStudents.some((s) => s.id === e.studentId)).length,
          0
        );
        const totalPossible = mod.meetings.length * filteredStudents.length;

        return (
          <div key={mod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Module Row */}
            <div
              onClick={() => toggleModule(mod.id)}
              className={`flex items-center gap-3 px-5 py-4 cursor-pointer select-none transition hover:bg-slate-50 ${mod.isActive ? "border-l-4 border-emerald-500" : ""}`}
            >
              <div className={`w-8 h-8 shrink-0 rounded-lg text-xs font-black flex items-center justify-center ${mod.isActive ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"}`}>
                {mod.moduleNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{mod.title}</p>
                  {mod.isActive && <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">✦ AKTIF</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {totalEvals}/{totalPossible} penilaian selesai
                </p>
              </div>

              {/* Progress bar */}
              <div className="hidden sm:block w-24 shrink-0">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: totalPossible > 0 ? `${Math.round((totalEvals / totalPossible) * 100)}%` : "0%" }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-right mt-0.5">
                  {totalPossible > 0 ? Math.round((totalEvals / totalPossible) * 100) : 0}%
                </p>
              </div>

              <div className="text-slate-400 shrink-0">
                {isModOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Meetings */}
            {isModOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {mod.meetings.map((meeting) => {
                  const isMeetOpen = openMeetings.has(meeting.id);
                  const evalCount = meeting.meetingEvaluations.length;

                  return (
                    <div key={meeting.id}>
                      {/* Meeting Row */}
                      <div
                        onClick={() => toggleMeeting(meeting.id)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 transition select-none ${meeting.isPerformance ? "bg-amber-50/50" : "bg-slate-50/30"}`}
                      >
                        <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${meeting.isPerformance ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {meeting.isPerformance ? <Trophy className="w-3.5 h-3.5" /> : meeting.meetingNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-700">
                              Pertemuan {meeting.meetingNumber}
                              {meeting.isPerformance && <span className="ml-1 text-amber-600">(Performance)</span>}
                            </p>
                            {evalCount === filteredStudents.length && filteredStudents.length > 0 && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{meeting.material}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            evalCount === filteredStudents.length && filteredStudents.length > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : evalCount > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {evalCount}/{filteredStudents.length} dinilai
                          </span>
                          {isMeetOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Student list for this meeting */}
                      {isMeetOpen && (
                        <div className="bg-white border-t border-slate-100">
                          {students.length === 0 ? (
                            <p className="px-12 py-4 text-xs text-slate-400 italic">Tidak ada murid aktif di program ini.</p>
                          ) : filteredStudents.length === 0 ? (
                            <p className="px-12 py-4 text-xs text-slate-400 italic">
                              Tidak ada murid yang cocok dengan pencarian "{searchQuery}".
                            </p>
                          ) : (
                            <ul className="divide-y divide-slate-50">
                              {filteredStudents.map((student) => {
                                const existingEval = meeting.meetingEvaluations.find(
                                  (e) => e.studentId === student.id
                                );
                                const key = `${student.id}-${meeting.id}`;
                                const isLoadingThis = loadingEval === key;

                                return (
                                  <li key={student.id} className="flex items-center gap-3 px-12 py-2.5 hover:bg-slate-50 group transition">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                                    </div>

                                    {existingEval ? (
                                      <div className="flex items-center gap-2">
                                        <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-black ${PREDICATE_COLORS[existingEval.predicate] || "bg-slate-300 text-white"}`}>
                                          {existingEval.predicate}
                                        </span>
                                        <button
                                          onClick={() => openEvalForm(student, meeting, mod.title, mod.moduleNumber)}
                                          disabled={isLoadingThis}
                                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition"
                                        >
                                          {isLoadingThis ? "..." : "Edit"}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => openEvalForm(student, meeting, mod.title, mod.moduleNumber)}
                                        disabled={isLoadingThis}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                      >
                                        {isLoadingThis ? (
                                          <span className="animate-pulse">...</span>
                                        ) : (
                                          <><Star className="w-3 h-3" /> Nilai</>
                                        )}
                                      </button>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Eval Form Modal */}
      {evalForm && (
        <MeetingEvalForm
          studentId={evalForm.studentId}
          studentName={evalForm.studentName}
          meetingId={evalForm.meetingId}
          meetingLabel={evalForm.meetingLabel}
          programCategory={programCategory}
          programName={programName}
          existingEval={evalForm.existingEval}
          onClose={() => setEvalForm(null)}
        />
      )}
    </div>
  );
}
