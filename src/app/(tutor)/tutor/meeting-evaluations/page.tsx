import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookOpen } from "lucide-react";
import { getModulesWithMeetings, getStudentsInProgram, getProgramsWithCurriculum } from "./actions";
import MeetingEvaluationsClient from "./MeetingEvaluationsClient";

export const dynamic = "force-dynamic";

export default async function MeetingEvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { programId } = await searchParams;

  const programs = await getProgramsWithCurriculum();

  const selectedProgram = programs.find((p: any) => p.id === programId);
  const modules = programId ? await getModulesWithMeetings(programId) : [];
  const students = programId ? await getStudentsInProgram(programId) : [];

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Evaluasi Per Pertemuan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Penilaian murid per pertemuan modul (Sistem Rotasi Kiddos).
        </p>
      </div>

      {/* Program Selector */}
      <form method="GET" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Pilih Program
            </label>
            <select
              name="programId"
              defaultValue={programId || ""}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Program --</option>
              {programs.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              Tampilkan
            </button>
          </div>
        </div>
      </form>

      {/* Empty state — belum pilih program */}
      {!programId && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-500">Pilih program terlebih dahulu</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan dropdown di atas untuk memilih program Kiddos.</p>
        </div>
      )}

      {/* No curriculum yet */}
      {programId && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-500">Kurikulum belum dibuat</p>
          <p className="text-xs text-slate-400 mt-1">
            Generate kurikulum di <span className="font-bold text-indigo-600">Admin → Kelola Program</span> terlebih dahulu.
          </p>
        </div>
      )}

      {/* Main Content — render segera saat programId ada, walau modul belum ada */}
      {programId && (
        <MeetingEvaluationsClient
          modules={modules}
          students={students}
          programName={selectedProgram?.name || "Program"}
          programCategory={selectedProgram?.category}
        />
      )}
    </div>
  );
}
