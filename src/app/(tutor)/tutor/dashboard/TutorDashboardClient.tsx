"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Award,
  X,
  Loader2,
  Star,
  AlertTriangle,
} from "lucide-react";
import { submitScheduleAttendance } from "../actions";
import ClassEvaluationModal from "./ClassEvaluationModal";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";
import { PendingAttendanceWidget } from "./PendingAttendanceWidget";
import type { PendingSession } from "./pending-actions";

// --- Types ---
export type EligibleStudent = {
  id: string;
  name: string;
  activeProgram: string | null;
  existingStatus: string | null;
};

export type SessionTask = {
  id: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  isCompleted: boolean;
  className: string;
  programId: string;
  programType: string;
  programCategory?: string;
  sessionId: string | null;
  students: EligibleStudent[];
  globalPoolStudents?: EligibleStudent[];
};

export type QuickStat = {
  label: string;
  value: string | number;
  iconName: "BookOpen" | "AlertCircle" | "Award";
  color: string;
  bg: string;
};

const ICON_MAP = { BookOpen, AlertCircle, Award } as const;
const ATTENDANCE_OPTIONS = ["PRESENT", "ABSENT", "EXCUSED", "SICK"] as const;
export type StudentSearchItem = { id: string; name: string; activeProgram: string | null };

// --- MAIN CLIENT COMPONENT ---
export function TutorDashboardClient({
  tutorName,
  todaySessions,
  quickStats,
  isEvalDay,
  announcements,
  pendingAttendances,
}: {
  tutorName: string;
  todaySessions: SessionTask[];
  quickStats: QuickStat[];
  isEvalDay: boolean;
  announcements: { id: string; title: string; message: string }[];
  pendingAttendances: PendingSession[];
}) {
  const [activeTab, setActiveTab] = useState<"today" | "pending">("today");
  const [selectedTask, setSelectedTask] = useState<SessionTask | null>(null);
  const [isPending, startTransition] = useTransition();
  const [evaluatingTask, setEvaluatingTask] = useState<SessionTask | null>(null);

  const [studentEvals, setStudentEvals] = useState<Record<string, { status: string }>>({});
  const [tutorNotes, setTutorNotes] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [modalStudents, setModalStudents] = useState<EligibleStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenModal = (task: SessionTask) => {
    setSelectedTask(task);
    setTutorNotes("");
    setRescheduleNotes("");
    setModalStudents(task.students);
    const initialEvals: Record<string, { status: string }> = {};
    task.students.forEach((s) => {
      if (s.existingStatus) {
        initialEvals[s.id] = { status: s.existingStatus };
      }
    });
    setStudentEvals(initialEvals);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setModalStudents([]);
    setSearchQuery("");
  };

  const handleRemoveStudent = (studentId: string) => {
    setModalStudents((prev) => prev.filter((s) => s.id !== studentId));
    setStudentEvals((prev) => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!selectedTask) return;
    const formData = new FormData();
    formData.append("scheduleId", selectedTask.id);
    formData.append("tutorNotes", tutorNotes);
    formData.append("rescheduleNotes", rescheduleNotes);
    formData.append("isEvalDay", isEvalDay ? "true" : "false");

    modalStudents.forEach((s) => {
      const eval_ = studentEvals[s.id];
      if (!eval_ || !eval_.status) return;
      formData.append("studentId", s.id);
      formData.append("status", eval_.status);
    });

    startTransition(async () => {
      const res = await submitScheduleAttendance(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Attendance submitted successfully!");
        handleCloseModal();
      }
    });
  };

  const updateStudentEval = (studentId: string, field: string, value: string | number) => {
    setStudentEvals((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { status: "" }), [field]: value },
    }));
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-24 relative">

      {/* 1. Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {greeting}, {tutorName?.split(" ")[0] || "Tutor"} 👋
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          You&apos;re doing great! Here is your dashboard overview.
          {isEvalDay && (
            <span className="ml-2 inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs font-bold">
              📝 Evaluation Day
            </span>
          )}
        </p>
      </div>

      {/* 2. Announcement Banner */}
      <div className="-mt-2">
        <AnnouncementBanner announcements={announcements} />
      </div>

      {/* 3. Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {quickStats.map((stat, idx) => {
          const Icon = ICON_MAP[stat.iconName];
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Tab Section */}
      <div className="flex flex-col gap-5">

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          {/* Tab: Jadwal Hari Ini */}
          <button
            onClick={() => setActiveTab("today")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "today"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Jadwal Hari Ini
            {todaySessions.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold">
                {todaySessions.length}
              </span>
            )}
          </button>

          {/* Tab: Tanggungan Presensi */}
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "pending"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Tanggungan Presensi
            {pendingAttendances.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold animate-pulse">
                {pendingAttendances.length}
              </span>
            )}
          </button>
        </div>

        {/* === TAB CONTENT: Jadwal Hari Ini === */}
        {activeTab === "today" && (
          todaySessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center gap-4">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Tidak ada jadwal kelas hari ini!</h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm">
                Hore! Tidak ada jadwal mengajar untuk Anda di hari ini. Selamat beristirahat 🎉
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {todaySessions.map((task) => {
                const isCompleted = task.isCompleted;
                const eligibleCount = task.students.length;
                return (
                  <div
                    key={task.id}
                    className={`group flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-2xl border border-slate-200 border-l-4 ${
                      isCompleted ? "border-l-emerald-400 opacity-80" : "border-l-blue-500"
                    } p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md`}
                  >
                    {/* Info Column */}
                    <div className="flex items-start gap-4 sm:gap-5 w-full md:w-auto">
                      <div className={`p-3 sm:p-4 rounded-xl flex-shrink-0 ${
                        isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-slate-900">{task.timeSlot}</span>
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {task.programType}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✅ Presensi Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              🔵 Belum Presensi
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
                          {task.className}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            {eligibleCount} Eligible Students
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              <Star className="w-3.5 h-3.5" />
                              {task.students.filter(s => s.existingStatus === "PRESENT").length} Murid Hadir
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Column */}
                    <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => setEvaluatingTask(task)}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200"
                        >
                          📝 Evaluasi Kelas
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(task)}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200"
                        >
                          Masuk Kelas / Presensi
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* === TAB CONTENT: Tanggungan Presensi === */}
        {activeTab === "pending" && (
          <PendingAttendanceWidget pending={pendingAttendances} />
        )}
      </div>

      {/* ── Attendance Modal ── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {selectedTask.className} • {selectedTask.timeSlot}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Cari nama murid di kelas ini..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm placeholder-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Student Count */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {modalStudents.length} Students in Class
                </p>
              </div>

              {/* Per-Student Attendance */}
              {modalStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8 font-medium">
                  Belum ada siswa yang cocok dengan pencarian.
                </div>
              ) : (
                modalStudents
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((student) => {
                    const eval_ = studentEvals[student.id] || { status: "" };
                    return (
                      <div key={student.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{student.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.activeProgram && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-100">
                                {student.activeProgram}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(student.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ATTENDANCE_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => updateStudentEval(student.id, "status", opt)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                                eval_.status === opt
                                  ? opt === "ABSENT" || opt === "SICK"
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : opt === "EXCUSED"
                                      ? "bg-amber-50 border-amber-200 text-amber-700"
                                      : "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}

              {/* Tutor Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Tutor Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={tutorNotes}
                  onChange={(e) => setTutorNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-50"
                  placeholder="Notes on student performance, areas of improvement..."
                />
              </div>

              {/* Reschedule Notes (Private only) */}
              {selectedTask.programType === "Private" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="block text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Reschedule Notes
                  </label>
                  <p className="text-xs text-amber-700/80 mb-3 font-medium">
                    This is a PRIVATE class. If rescheduled, please note the details.
                  </p>
                  <textarea
                    rows={2}
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    className="w-full border border-amber-200 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white transition-all shadow-sm"
                    placeholder="e.g., Rescheduled from Monday due to student request."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-400">
                {modalStudents.length} students • {isEvalDay ? "with evaluation" : "status only"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || modalStudents.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Attendance"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Class Evaluation Modal ── */}
      {evaluatingTask && (
        <ClassEvaluationModal
          task={evaluatingTask}
          onClose={() => setEvaluatingTask(null)}
        />
      )}
    </div>
  );
}
