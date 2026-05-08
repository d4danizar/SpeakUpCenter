import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentCurriculum } from "./actions";
import RaporClient from "./RaporClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rapor Nilai | SpeakUp Center",
  description: "Lihat perkembangan nilai dan evaluasi Tutor per pertemuan.",
};

export default async function RaporPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const data = await getStudentCurriculum(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            PORTAL MURID &amp; ORANG TUA
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Rapor Nilai Perkembangan 📋
          </h1>
          {data?.programClass && (
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Program:{" "}
              <span className="font-bold text-indigo-600">
                {data.programClass.name}
              </span>
            </p>
          )}
        </div>

        {!data ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-bold">Belum terdaftar di program apapun.</p>
            <p className="text-sm mt-1">Hubungi Admin untuk mendaftarkan kelas Anda.</p>
          </div>
        ) : (
          <RaporClient
            modules={data.modules}
            programCategory={data.programClass.category}
          />
        )}
      </div>
    </div>
  );
}
