"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Star,
  ChevronDown,
  UserPlus,
  Search,
  Pencil,
} from "lucide-react";
import { getSessionDetail, updateAttendance, type SessionDetailData } from "../../lib/session-detail-actions";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PRESENT: { label: "Present", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  ABSENT:  { label: "Absent",  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  EXCUSED: { label: "Excused", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  SICK:    { label: "Sick",    color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200" },
};

const STATUSES = ["PRESENT", "ABSENT", "EXCUSED", "SICK"] as const;

export function SessionDetailModal({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SessionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit state
  const [editStatuses, setEditStatuses] = useState<Record<string, string>>({});
  const [editPronunciations, setEditPronunciations] = useState<Record<string, number>>({});
  const [editFluencies, setEditFluencies] = useState<Record<string, number>>({});
  const [editVocabularies, setEditVocabularies] = useState<Record<string, number>>({});
  const [editNotes, setEditNotes] = useState("");

  // Manual add
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [manualStudents, setManualStudents] = useState<{ id: string; name: string; activeProgram: string | null }[]>([]);

  useEffect(() => {
    setLoading(true);
    getSessionDetail(sessionId).then((result) => {
      setData(result);
      setLoading(false);
      if (result && result.attendances.length > 0) {
        // Pre-fill edit state from existing data
        const statuses: Record<string, string> = {};
        const prons: Record<string, number> = {};
        const fluens: Record<string, number> = {};
        const vocabs: Record<string, number> = {};
        result.attendances.forEach((a) => {
          statuses[a.studentId] = a.status;
          prons[a.studentId] = a.pronunciation ?? 7;
          fluens[a.studentId] = a.fluency ?? 7;
          vocabs[a.studentId] = a.vocabulary ?? 7;
        });
        setEditStatuses(statuses);
        setEditPronunciations(prons);
        setEditFluencies(fluens);
        setEditVocabularies(vocabs);
        setEditNotes(result.attendances[0]?.tutorNotes || "");
      }
    });
  }, [sessionId]);

  const hasAttendance = data && data.attendances.length > 0;

  // All students for edit mode: existing attendances + manual adds
  const editStudentList = useMemo(() => {
    if (!data) return [];
    const existing = data.attendances.map((a) => ({
      id: a.studentId,
      name: a.studentName,
      activeProgram: a.studentProgram,
    }));
    const existingIds = new Set(existing.map((s) => s.id));
    const extras = manualStudents.filter((s) => !existingIds.has(s.id));
    return [...existing, ...extras];
  }, [data, manualStudents]);

  // Search results for manual add in edit mode
  const addSearchResults = useMemo(() => {
    if (!data || !addSearch || addSearch.length < 2) return [];
    const q = addSearch.toLowerCase();
    const existingIds = new Set(editStudentList.map((s) => s.id));
    return data.globalPoolStudents
      .filter((s) => !existingIds.has(s.id) && s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [data, addSearch, editStudentList]);

  const handleAddManualStudent = (student: { id: string; name: string; activeProgram: string | null }) => {
    setManualStudents((prev) => [...prev, student]);
    setEditStatuses((prev) => ({ ...prev, [student.id]: "PRESENT" }));
    setEditPronunciations((prev) => ({ ...prev, [student.id]: 7 }));
    setEditFluencies((prev) => ({ ...prev, [student.id]: 7 }));
    setEditVocabularies((prev) => ({ ...prev, [student.id]: 7 }));
    setAddSearch("");
  };

  const handleSaveEdit = () => {
    if (!data) return;
    const formData = new FormData();
    formData.set("sessionId", data.id);
    formData.set("tutorNotes", editNotes);

    editStudentList.forEach((student) => {
      formData.append("studentId", student.id);
      formData.append("status", editStatuses[student.id] || "PRESENT");
      formData.append("pronunciation", String(editPronunciations[student.id] ?? 7));
      formData.append("fluency", String(editFluencies[student.id] ?? 7));
      formData.append("vocabulary", String(editVocabularies[student.id] ?? 7));
    });

    startTransition(async () => {
      const res = await updateAttendance(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Attendance updated successfully!");
        // Refetch data
        const refreshed = await getSessionDetail(sessionId);
        setData(refreshed);
        setEditMode(false);
        setManualStudents([]);
      }
    });
  };

  // Score dot renderer
  const ScoreDots = ({ value, max = 10 }: { value: number | null; max?: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            value && i < value ? "bg-indigo-500" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            ) : data ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 truncate">{data.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock className="w-3 h-3" /> {data.timeSlot}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    📅 {format(new Date(data.date), "EEEE, dd MMM yyyy")}
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                    data.isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {data.isCompleted ? "Completed" : "Upcoming"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-red-500">Session not found</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500 font-medium">Loading session details...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-500">Session not found.</div>
          ) : (
            <>
              {/* Tutor Info */}
              <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {data.tutorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Tutor</p>
                  <p className="text-sm font-bold text-indigo-900">{data.tutorName}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Program</p>
                  <p className="text-sm font-bold text-indigo-900">{data.programType}</p>
                </div>
              </div>

              {/* ========== EDIT MODE ========== */}
              {editMode ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {editStudentList.length} Students
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddStudent(!showAddStudent)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Student
                    </button>
                  </div>

                  {/* Manual add search */}
                  {showAddStudent && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={addSearch}
                          onChange={(e) => setAddSearch(e.target.value)}
                          placeholder="Search student name..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {addSearchResults.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {addSearchResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleAddManualStudent(s)}
                              className="flex items-center justify-between px-3 py-2 text-sm bg-white hover:bg-indigo-50 rounded-lg border border-slate-100 transition-colors text-left"
                            >
                              <span className="font-medium text-slate-900">{s.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{s.activeProgram || "—"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {addSearch.length >= 2 && addSearchResults.length === 0 && (
                        <p className="text-xs text-slate-400 font-medium text-center py-2">No students found</p>
                      )}
                    </div>
                  )}

                  {/* Editable student rows */}
                  {editStudentList.map((student) => {
                    const status = editStatuses[student.id] || "PRESENT";
                    return (
                      <div key={student.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{student.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">{student.activeProgram || "—"}</p>
                            </div>
                          </div>
                          {/* Status selector */}
                          <select
                            value={status}
                            onChange={(e) => setEditStatuses((prev) => ({ ...prev, [student.id]: e.target.value }))}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer ${STATUS_CONFIG[status]?.bg || ""} ${STATUS_CONFIG[status]?.color || ""} ${STATUS_CONFIG[status]?.border || ""}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Evaluation sliders */}
                        {data.isEvalDay && status === "PRESENT" && (
                          <div className="grid grid-cols-3 gap-3 pt-1">
                            {([
                              ["Pronunciation", editPronunciations, setEditPronunciations],
                              ["Fluency", editFluencies, setEditFluencies],
                              ["Vocabulary", editVocabularies, setEditVocabularies],
                            ] as const).map(([label, stateObj, setter]) => (
                              <div key={label} className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                                <input
                                  type="range"
                                  min={1}
                                  max={10}
                                  value={(stateObj as Record<string, number>)[student.id] ?? 7}
                                  onChange={(e) => (setter as React.Dispatch<React.SetStateAction<Record<string, number>>>)((prev) => ({ ...prev, [student.id]: parseInt(e.target.value) }))}
                                  className="w-full accent-indigo-600"
                                />
                                <p className="text-center text-xs font-bold text-indigo-600">{(stateObj as Record<string, number>)[student.id] ?? 7}/10</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Tutor Notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Tutor Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      placeholder="Optional notes about this session..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              ) : hasAttendance ? (
                /* ========== POST-CLASS: Attendance Records ========== */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Attendance Record • {data.attendances.length} students
                    </p>
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit Attendance
                    </button>
                  </div>

                  {data.attendances.map((a) => {
                    const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.PRESENT;
                    return (
                      <div key={a.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {a.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{a.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">{a.studentProgram || "—"}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Evaluations (if any) */}
                        {(a.pronunciation || a.fluency || a.vocabulary) && (
                          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-3">
                            {[
                              { label: "Pronunciation", val: a.pronunciation },
                              { label: "Fluency", val: a.fluency },
                              { label: "Vocabulary", val: a.vocabulary },
                            ].map((ev) => (
                              <div key={ev.label} className="flex flex-col gap-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ev.label}</p>
                                <div className="flex items-center gap-1.5">
                                  <ScoreDots value={ev.val} />
                                  <span className="text-xs font-bold text-slate-600">{ev.val || "—"}/10</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tutor Notes */}
                        {a.tutorNotes && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{a.tutorNotes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ========== PRE-CLASS: Expected Students ========== */
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Expected Students • {data.eligibleStudents.length} eligible
                  </p>

                  {data.eligibleStudents.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-200">
                      No eligible students for this session.
                    </div>
                  ) : (
                    data.eligibleStudents.map((s) => (
                      <div key={s.id} className="flex items-center gap-2.5 bg-slate-50 rounded-xl border border-slate-200 p-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">{s.activeProgram || "—"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && data && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={() => { setEditMode(false); setManualStudents([]); }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
