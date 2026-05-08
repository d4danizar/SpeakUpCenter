import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import BulkImportClient from "./BulkImportClient";

export const dynamic = "force-dynamic";

export default async function ImportStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <a href="/admin/students" className="hover:text-indigo-600 transition font-semibold">
            ← Daftar Murid
          </a>
        </div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Upload className="w-6 h-6 text-indigo-600" />
          Bulk Import Murid dari Excel
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload file .xlsx dengan kolom <strong>Nama</strong> dan <strong>Nomor WhatsApp</strong>.
          Password default murid = nomor WhatsApp yang telah dinormalisasi.
        </p>

        {/* Panduan kolom */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kolom Excel yang Didukung</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { col: "Nama", req: true, note: "Wajib" },
              { col: "Nomor WhatsApp", req: true, note: "Wajib — multi-number otomatis diambil pertama" },
              { col: "Tanggal Mulai", req: false, note: 'Opsional — cth: "Juli 2025"' },
              { col: "Tanggal Selesai", req: false, note: "Opsional" },
              { col: "Pilihan Jadwal", req: false, note: "Opsional" },
              { col: "Status", req: false, note: 'Default: "Aktif"' },
            ].map((c) => (
              <div key={c.col} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.req ? "bg-red-400" : "bg-slate-300"}`} />
                <div>
                  <p className="text-xs font-bold text-slate-800 font-mono">{c.col}</p>
                  <p className="text-[10px] text-slate-500">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BulkImportClient />
    </div>
  );
}
