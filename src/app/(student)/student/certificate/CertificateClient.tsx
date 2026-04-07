"use client";

import { Printer, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type CertificateData = {
  student: {
    name: string;
    activeProgram: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  scores: {
    fluency: number;
    pronunciation: number;
    vocabulary: number;
    overall: number;
    predicate: string;
  };
  isEligible: boolean;
};

export function CertificateClient({ data }: { data: CertificateData }) {
  const { student, scores } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-10 px-4 print:p-0 print:bg-white overflow-x-auto">
      
      {/* Action Bar (Hidden in Print) */}
      <div className="w-[297mm] max-w-full flex justify-between items-center mb-6 print:hidden">
        <Link 
          href="/student/dashboard" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all border border-indigo-400/50"
        >
          <Printer className="w-4 h-4" />
          Download PDF / Print
        </button>
      </div>

      {/* Certificate Canvas (A4 Landscape) */}
      <div className="w-[297mm] h-[210mm] bg-white text-slate-900 shadow-2xl relative flex-shrink-0 print:shadow-none mx-auto overflow-hidden">
        
        {/* Certificate Border & Accents */}
        <div className="absolute inset-4 border-[6px] border-double border-indigo-900/40 pointer-events-none rounded-lg z-10" />
        <div className="absolute inset-6 border-[1px] border-indigo-900/20 pointer-events-none rounded z-10" />
        
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50/50 rounded-br-full print:bg-slate-50 border-b border-r border-indigo-100" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-tl-full print:bg-slate-50 border-t border-l border-indigo-100" />

        <div className="relative z-20 w-full h-full flex flex-col justify-between p-16 pb-20">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="w-40 h-16 bg-slate-200 border border-slate-300 rounded-sm flex items-center justify-center text-[10px] font-bold text-slate-400 tracking-widest uppercase shadow-sm">
              [Logo Lembaga]
            </div>
            <div className="text-right">
              <p className="font-serif text-sm font-semibold tracking-widest text-slate-500 uppercase">Certificate of Completion</p>
              <p className="font-serif text-[10px] text-slate-400 uppercase mt-1">ID: CERT-{student.name.substring(0,3).toUpperCase()}-{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Core Content */}
          <div className="text-center flex flex-col items-center mt-[-3rem]">
            <h1 className="font-serif text-5xl md:text-6xl text-indigo-950 tracking-tight font-black uppercase shadow-sm drop-shadow-sm mb-6">
              Certificate <br /> <span className="text-3xl tracking-widest text-slate-600 font-light lowercase font-sans">of</span> Achievement
            </h1>
            
            <p className="font-serif italic text-lg text-slate-600 mb-6">This is proudly presented to</p>

            {/* Student Name */}
            <h2 className="font-serif text-4xl md:text-5xl text-slate-900 font-bold tracking-tight border-b-2 border-indigo-200 pb-2 px-12 capitalize inline-block mb-8 relative">
              {student.name}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-indigo-500 rounded-full"/>
            </h2>

            <p className="font-serif text-base text-slate-700 max-w-xl mx-auto leading-relaxed">
              for successfully completing the rigorous curriculum and demonstrating outstanding dedication in the 
              <span className="font-bold text-indigo-900"> {student.activeProgram} </span> program.
            </p>
            
            {/* Expanded Score Section */}
            <div className="mt-5 w-full max-w-3xl flex flex-col sm:flex-row items-stretch justify-center gap-6 font-serif">
              
              {/* Individual Scores (Left) */}
              <div className="flex-[3] bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center gap-3">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-xs uppercase tracking-widest text-slate-500">Fluency</span>
                  <span className="font-bold text-base">{scores.fluency.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span></span>
                </div>
                <div className="w-full h-px bg-slate-200/60" />
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-xs uppercase tracking-widest text-slate-500">Pronunciation</span>
                  <span className="font-bold text-base">{scores.pronunciation.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span></span>
                </div>
                <div className="w-full h-px bg-slate-200/60" />
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-xs uppercase tracking-widest text-slate-500">Vocabulary</span>
                  <span className="font-bold text-base">{scores.vocabulary.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 10</span></span>
                </div>
              </div>

              {/* Overall & Predicate (Right) */}
              <div className="flex-[4] bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex items-center justify-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -mr-10 -mt-10 blur-xl"></div>
                
                <div className="text-center relative z-10">
                  <p className="text-xs uppercase tracking-widest text-indigo-500 font-sans font-bold mb-1">Overall</p>
                  <p className="text-5xl text-indigo-700 font-black">{scores.overall.toFixed(1)}</p>
                </div>
                
                <div className="w-px h-16 bg-indigo-200/60 relative z-10" />
                
                <div className="text-center flex flex-col items-center justify-center relative z-10">
                  <p className="text-xs uppercase tracking-widest text-indigo-500 font-sans font-bold mb-2">Grade</p>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black shadow-sm border-[3px] ${
                    scores.predicate === 'A' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                    scores.predicate === 'B' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                    scores.predicate === 'C' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                    scores.predicate === 'D' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                    'bg-red-100 text-red-600 border-red-200'
                  }`}>
                    {scores.predicate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (Signatures & Date) */}
          <div className="flex justify-between items-end px-12 mt-8">
            <div className="text-center">
              <p className="font-serif font-bold text-slate-800 text-lg border-b border-slate-400 pb-1 mb-2 px-6">
                {student.endDate ? format(new Date(student.endDate), "MMMM dd, yyyy") : format(new Date(), "MMMM dd, yyyy")}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-sans font-bold">Date of Issue</p>
            </div>
            
            <div className="text-center flex flex-col items-center">
              <div className="w-48 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded mb-2 flex items-center justify-center text-[10px] font-bold text-slate-400 tracking-widest uppercase relative overflow-hidden">
                [Signature Box]
                <div className="absolute inset-0 bg-blue-50/10 pointer-events-none" />
              </div>
              <p className="font-serif font-bold text-slate-800 text-base border-t border-slate-300 pt-2 px-8 w-full max-w-[250px]">
                Direktur Lembaga
              </p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
