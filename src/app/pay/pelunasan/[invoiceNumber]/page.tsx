import { prisma } from "../../../../lib/prisma";
import { PelunasanForm } from "./PelunasanForm";

export default async function PelunasanPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { lead: true },
  });

  if (!invoice) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Invoice Tidak Ditemukan
          </h1>
        </div>
      </main>
    );
  }

  // Cek apakah invoice ini bisa dilunasi (harus berstatus DP_PAID)
  // Atau jika sedang proses verifikasi pelunasan
  if (invoice.status === "WAITING_CONFIRMATION") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-amber-200 p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-amber-700 mb-2">
            Sedang Diverifikasi
          </h1>
          <p className="text-slate-600">
            Bukti pelunasan Anda sedang kami proses. Terima kasih!
          </p>
        </div>
      </main>
    );
  }

  if (invoice.status === "PAID") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-emerald-200 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-emerald-700 mb-2">
            Tagihan Lunas
          </h1>
          <p className="text-slate-600">
            Semua tagihan untuk program ini sudah dilunasi.
          </p>
        </div>
      </main>
    );
  }

  if (invoice.status !== "DP_PAID") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Status Tidak Valid
          </h1>
          <p className="text-slate-600">
            Halaman ini hanya untuk pelunasan tagihan DP.
          </p>
        </div>
      </main>
    );
  }

  // Hitung sisa tagihan (casting ke any sementara jika tipe Prisma di editor masih stale)
  const totalAmount = (invoice as any).totalAmount || 0;
  const paidAmount = (invoice as any).paidAmount || 0;
  const remainingDue = totalAmount - paidAmount;

  const amountFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(remainingDue);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-600 tracking-widest uppercase mb-1">
            SpeakUp Center
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Pelunasan Tagihan</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Silakan lunasi sisa tagihan program Anda.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">
            Total Sisa Tagihan
          </span>
          <div className="text-4xl font-black text-indigo-700 mb-2">
            {amountFormatted}
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Program: {(invoice as any).programName || '-'}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            {invoice.invoiceNumber}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 text-left">
            <p className="font-semibold mb-1">Transfer ke:</p>
            <p>
              🏦 BCA — <strong>1234567890</strong> a/n SpeakUp Center
            </p>
          </div>
        </div>

        <PelunasanForm invoiceId={invoice.id} />
      </div>
    </main>
  );
}
