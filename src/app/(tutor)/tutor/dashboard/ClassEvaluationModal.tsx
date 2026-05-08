"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Loader2, Info } from "lucide-react";
import { type SessionTask } from "./TutorDashboardClient";
import { getCurriculumForProgram, getEvaluationsForStudents, getPresentStudents } from "./eval-actions";
import MeetingEvalForm from "../meeting-evaluations/MeetingEvalForm";

type Module = {
  id: string;
  moduleNumber: number;
  title: string;
  meetings: Meeting[];
};

type Meeting = {
  id: string;
  meetingNumber: number;
  material: string;
  rubricData?: any[] | null;
};

type Props = {
  task: SessionTask;
  onClose: () => void;
};

export default function ClassEvaluationModal({ task, onClose }: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(false);

  // Real-time present students from database
  const [presentStudents, setPresentStudents] = useState<{id: string, name: string}[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurriculumAndStudents() {
      if (!task.programId) return;
      try {
        const [curriculumData, studentsData] = await Promise.all([
          getCurriculumForProgram(task.programId),
          task.sessionId ? getPresentStudents(task.sessionId) : Promise.resolve([])
        ]);
        setModules(curriculumData);
        setPresentStudents(studentsData);
      } catch (err) {
        console.error("Failed to load curriculum or students:", err);
      } finally {
        setLoadingCurriculum(false);
        setLoadingStudents(false);
      }
    }
    loadCurriculumAndStudents();
  }, [task.programId, task.sessionId]);

  useEffect(() => {
    async function loadEvaluations() {
      if (!selectedMeetingId || presentStudents.length === 0) return;
      setLoadingEvals(true);
      try {
        const evals = await getEvaluationsForStudents(
          presentStudents.map(s => s.id),
          selectedMeetingId
        );
        setEvaluations(evals);
      } catch (err) {
        console.error("Failed to load evaluations:", err);
      } finally {
        setLoadingEvals(false);
      }
    }
    loadEvaluations();
  }, [selectedMeetingId]);

  // Determine the meeting label and descriptions
  let selectedMeetingLabel = "";
  let selectedMeetingObj: Meeting | null = null;
  if (selectedMeetingId) {
    for (const mod of modules) {
      const meet = mod.meetings.find(m => m.id === selectedMeetingId);
      if (meet) {
        selectedMeetingLabel = `${mod.title} — Pertemuan ${meet.meetingNumber}`;
        selectedMeetingObj = meet;
        break;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Batch Evaluation</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {task.className} — {task.timeSlot}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Step 1: Curriculum Selection */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-4 h-4" /> 1. Pilih Materi Sesi Ini
            </label>
            {loadingCurriculum ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 p-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat kurikulum...
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-amber-600 font-medium">
                Belum ada kurikulum yang diatur untuk program ini.
              </p>
            ) : (
              <select
                value={selectedMeetingId}
                onChange={(e) => {
                  setSelectedMeetingId(e.target.value);
                  setOpenAccordion(null); // Reset accordion
                }}
                className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700 shadow-sm transition-all"
              >
                <option value="">Pilih Modul & Pertemuan...</option>
                {modules.map((mod) => (
                  <optgroup key={mod.id} label={`Modul ${mod.moduleNumber}: ${mod.title}`}>
                    {mod.meetings.map((meet) => (
                      <option key={meet.id} value={meet.id}>
                        Pertemuan {meet.meetingNumber} — {meet.material}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Student Evaluations */}
          {selectedMeetingId ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                2. Evaluasi Murid ({presentStudents.length} Hadir)
              </h3>
              
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium text-slate-500">Memuat daftar murid hadir...</span>
                </div>
              ) : presentStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tidak ada murid yang berstatus PRESENT (Hadir) pada sesi ini.
                </div>
              ) : loadingEvals ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium text-slate-500">Memuat data nilai...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {presentStudents.map((student) => {
                    const isOpen = openAccordion === student.id;
                    const existingEval = evaluations.find(e => e.studentId === student.id) || null;
                    const isCompleted = existingEval && (
                      existingEval.predicate || 
                      (existingEval.aspectScores && Object.values(existingEval.aspectScores).some(Boolean))
                    );

                    return (
                      <div key={student.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                        {/* Accordion Header */}
                        <button
                          onClick={() => setOpenAccordion(isOpen ? null : student.id)}
                          className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                            isOpen ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{student.name}</span>
                              <span className="text-[10px] font-medium text-slate-500">
                                Status Sesi: <span className="text-emerald-600 font-bold">Hadir</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isCompleted && !isOpen && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                                Selesai
                              </span>
                            )}
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Body */}
                        {isOpen && (
                          <div className="p-4 bg-white border-t border-slate-100">
                            <MeetingEvalForm
                              studentId={student.id}
                              studentName={student.name}
                              meetingId={selectedMeetingId}
                              meetingLabel={selectedMeetingLabel}
                              meetingDesc={selectedMeetingObj}
                              programCategory={task.programCategory || task.programType}
                              programName={task.programType}
                              existingEval={existingEval}
                              onClose={() => setOpenAccordion(null)} // Automatically close on save
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-sm font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center gap-3">
              <Info className="w-8 h-8 text-slate-300" />
              Pilih materi kurikulum di atas untuk mulai mengevaluasi murid.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
