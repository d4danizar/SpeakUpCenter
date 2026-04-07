"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, Users, FileText, CheckCircle, BrainCircuit } from "lucide-react";
import { getProgramsForFilter, getStudentsByProgram, submitAdHocEvaluation } from "./actions";
import { EVALUATION_RUBRICS, EvaluationGrade } from "../../../../lib/constants/evaluationRubrics";

export function EvaluationsClient({ tutorId }: { tutorId: string }) {
  // Cascading Selection State
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Selected config
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  
  let rubricKey: "KIDS" | "TEENS" | "ADULTS" | null = null;
  if (selectedProgram) {
    const programName = selectedProgram.name.toLowerCase();
    rubricKey = "ADULTS"; // Default fallback
    if (programName.includes("kids") || programName.includes("kiddos")) {
      rubricKey = "KIDS";
    } else if (programName.includes("teens") || programName.includes("remaja")) {
      rubricKey = "TEENS";
    }
  }

  // Form State
  const [metricsData, setMetricsData] = useState<Record<string, EvaluationGrade>>({});
  const [notes, setNotes] = useState("");

  // Load Programs on Mount
  useEffect(() => {
    let isMounted = true;
    getProgramsForFilter().then((res) => {
      if (isMounted) {
        setPrograms(res);
        setLoadingPrograms(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Load Students when Program changes
  useEffect(() => {
    if (!selectedProgramId) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }
    
    let isMounted = true;
    setLoadingStudents(true);
    getStudentsByProgram(selectedProgramId).then((res) => {
      if (isMounted) {
        setStudents(res);
        setLoadingStudents(false);
        // Reset cascaded fields
        setSelectedStudentId("");
        setSelectedModule("");
        setSelectedSession("");
      }
    });

    return () => { isMounted = false; };
  }, [selectedProgramId]);
  
  // Auto-select Module if there's only 1 option (e.g. ADULTS)
  const moduleOptions = rubricKey ? Object.keys(EVALUATION_RUBRICS[rubricKey]) : [];
  
  useEffect(() => {
    if (moduleOptions.length === 1 && selectedModule !== moduleOptions[0]) {
      setSelectedModule(moduleOptions[0]);
    }
  }, [moduleOptions.length, moduleOptions[0]]);

  // Reset form when rubric parameters change
  useEffect(() => {
    setMetricsData({});
    setNotes("");
  }, [selectedModule, selectedSession, selectedStudentId]);

  // Handle Radio Input Change
  const handleMetricChange = (metric: string, val: EvaluationGrade) => {
    setMetricsData(prev => ({ ...prev, [metric]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !selectedStudentId || !selectedModule || !selectedSession) {
      alert("Pastikan semua field (Program, Murid, Modul, Sesi) telah dipilih.");
      return;
    }

    // Verify all metrics are filled
    const expectedMetrics = EVALUATION_RUBRICS[rubricKey!][selectedModule][selectedSession] || [];
    const missingMetrics = expectedMetrics.filter(m => !metricsData[m]);
    if (missingMetrics.length > 0) {
      alert(`Anda belum menilai metrik berikut:\n- ${missingMetrics.join("\n- ")}`);
      return;
    }

    startTransition(async () => {
      const res = await submitAdHocEvaluation(
        selectedProgramId,
        selectedStudentId,
        tutorId,
        selectedModule,
        selectedSession,
        notes,
        JSON.stringify(metricsData)
      );

      if (res.error) {
        alert(res.error);
      } else {
        alert("Evaluasi berhasil disimpan!");
        // Reset sub-form to simulate completion
        setSelectedModule("");
        setSelectedSession("");
        setMetricsData({});
        setNotes("");
        // Optional: Refetch students to show updated status
        const updatedStudents = await getStudentsByProgram(selectedProgramId);
        setStudents(updatedStudents);
      }
    });
  };

  // Derivative Options
  const sessionOptions = rubricKey && selectedModule ? Object.keys(EVALUATION_RUBRICS[rubricKey as "KIDS"|"TEENS"|"ADULTS"][selectedModule]) : [];
  const activeMetricsList = rubricKey && selectedModule && selectedSession 
    ? (EVALUATION_RUBRICS[rubricKey as "KIDS"|"TEENS"|"ADULTS"][selectedModule][selectedSession] || []) 
    : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16">
      
      {/* CASCADING FILTER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          Kriteria Pemilihan Evaluasi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Pilih Program */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Program Kelas</label>
            <div className="relative">
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                disabled={loadingPrograms}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                required
              >
                <option value="">-- Pilih Program --</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {loadingPrograms ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          </div>

          {/* 2. Pilih Murid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Murid Dinilai</label>
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedProgramId || loadingStudents}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                required
              >
                <option value="">-- Pilih Murid --</option>
                {students.map((s) => (
                   <option key={s.id} value={s.id}>
                     {s.name} {s.evaluationsReceived?.length > 0 ? "✓" : ""}
                   </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          </div>

          {/* 3. Pilih Modul */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Modul</label>
            <div className="relative">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={!selectedStudentId || moduleOptions.length === 0}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                required
              >
                <option value="">-- Modul --</option>
                {moduleOptions.map(mod => <option key={mod} value={mod}>{mod}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

          {/* 4. Pilih Sesi */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Tipe Sesi</label>
            <div className="relative">
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                disabled={!selectedModule || sessionOptions.length === 0}
                className="w-full appearance-none bg-slate-50 border border-slate-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                required
              >
                <option value="">-- Sesi --</option>
                {sessionOptions.map(ses => <option key={ses} value={ses}>{ses}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* EVALUATION FORM */}
      {activeMetricsList.length > 0 && selectedStudentId ? (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-50 border-b border-indigo-100 p-5 flex items-start justify-between">
            <div>
              <h3 className="font-bold text-indigo-900 text-lg">Formulir Pengisian Evaluasi</h3>
              <p className="text-sm text-indigo-700/70 mt-1">
                Kamus Rubrik: <strong>{rubricKey}</strong> | {selectedModule} - {selectedSession}
              </p>
            </div>
            <div className="px-3 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-700 text-xs font-bold shadow-sm">
              {students.find(s => s.id === selectedStudentId)?.name}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-8">
            
            <div className="flex flex-col gap-5">
              <h4 className="text-sm font-bold text-slate-800 border-b gap-2 border-slate-100 pb-2 flex items-center">
                <span>Indikator Penilaian</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">A (Terbaik) - E</span>
              </h4>
              
              <div className="flex flex-col gap-4">
                {activeMetricsList.map((metric, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 transition-colors gap-4">
                    <span className="text-sm font-semibold text-slate-700 md:max-w-xs">{metric}</span>
                    
                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                      {(["A", "B", "C", "D", "E"] as EvaluationGrade[]).map((grade) => {
                        const isSelected = metricsData[metric] === grade;
                        // Color styling depending on grade
                        let colorClass = "text-slate-600 hover:bg-slate-50";
                        let activeColorClass = "bg-indigo-600 text-white font-bold ring-2 ring-indigo-600 ring-offset-1";
                        if (grade === "A") activeColorClass = "bg-emerald-500 text-white font-bold ring-2 ring-emerald-500 ring-offset-1";
                        else if (grade === "E") activeColorClass = "bg-rose-500 text-white font-bold ring-2 ring-rose-500 ring-offset-1";
                        
                        return (
                          <label 
                            key={grade} 
                            className={`relative cursor-pointer flex items-center justify-center w-8 h-8 rounded-md text-sm transition-all select-none
                              ${isSelected ? activeColorClass : colorClass}`}
                          >
                            <input
                              type="radio"
                              name={`metric-${idx}`}
                              value={grade}
                              checked={isSelected}
                              onChange={() => handleMetricChange(metric, grade)}
                              className="sr-only"
                              required
                            />
                            {grade}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Catatan Pelatih</h4>
               <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ceritakan observasi tambahan tentang anak ini (bisa dikosongi)..."
                  className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 hover:bg-white transition-colors"
                />
            </div>

          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-5 flex justify-end gap-3">
             <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Penilaian Rapor"}
              </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Pilih Kriteria Evaluasi</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Setelah Anda memilih Program, Murid, Modul, dan Sesi, formulir penilaian rubrik akan muncul di area ini.
          </p>
        </div>
      )}

    </div>
  );
}
