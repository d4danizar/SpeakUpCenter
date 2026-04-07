import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { generateCertificateData } from "./actions";
import { CertificateClient } from "./CertificateClient";

export default async function CertificatePage() {
  const sessionUser = await getServerSession(authOptions);
  
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  const data = await generateCertificateData(sessionUser.user.id);

  if (!data.isEligible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 font-sans space-y-4">
        <div className="p-4 bg-amber-50 rounded-full">
          <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 text-center">Sertifikat Belum Tersedia</h1>
        <p className="text-slate-600 text-center max-w-md">
          E-Certificate Anda saat ini sedang dikunci. Sertifikat hanya dapat diunduh setelah Anda menyelesaikan masa aktif program.
        </p>
        <a href="/student/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">
          Kembali ke Dashboard
        </a>
      </div>
    );
  }

  return <CertificateClient data={data} />;
}
