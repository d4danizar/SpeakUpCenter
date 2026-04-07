import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { EvaluationsClient } from "./EvaluationsClient";

export default async function EvaluationsPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Menu Evaluasi Deskriptif
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl text-balance">
          Tulis evaluasi perkembangan komprehensif untuk murid berdasarkan kelompok kelas (Conversation, EFK, EFT, Private).
        </p>
      </div>

      {/* Main Content (Interactive Client) */}
      <EvaluationsClient tutorId={sessionUser.user.id} />
    </div>
  );
}
