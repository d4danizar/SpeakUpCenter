import { prisma } from "../../../lib/prisma";
import { notFound } from "next/navigation";
import { CheckoutForm } from "./CheckoutForm";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { 
      lead: { select: { name: true, whatsapp: true } },
      program: { include: { schedules: true } }
    },
  });

  if (!invoice) notFound();

  // Cast to any temp to bypass stale TS cache on new schema fields
  const totalAmount = (invoice as any).totalAmount || 0;
  const paidAmount = (invoice as any).paidAmount || 0;

  const paidAmountFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(paidAmount);

  const totalAmountFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(totalAmount);

  // ── STATUS: PAID ─────────────────────────────────────────────────────────
  if (invoice.status === "PAID") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-emerald-200 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-emerald-700 mb-2">Pembayaran Dikonfirmasi!</h1>
          <p className="text-slate-600">
            Terima kasih! Pembayaran Anda untuk program{" "}
            <strong>{(invoice as any).program?.name}</strong> telah berhasil diverifikasi.
          </p>
          <p className="mt-4 text-sm text-slate-500 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            Silakan cek <strong>WhatsApp</strong> Anda untuk detail akun login portal siswa.
          </p>
        </div>
      </main>
    );
  }

  // ── STATUS: WAITING_CONFIRMATION ─────────────────────────────────────────
  if (invoice.status === "WAITING_CONFIRMATION") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-amber-200 p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-amber-700 mb-2">Sedang Diverifikasi</h1>
          <p className="text-slate-600">
            Bukti transfer Anda untuk program <strong>{(invoice as any).program?.name}</strong>{" "}
            sudah kami terima dan sedang dalam proses verifikasi oleh Admin.
          </p>
          <p className="mt-4 text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Mohon tunggu konfirmasi melalui WhatsApp. Biasanya dalam 1×24 jam.
          </p>
        </div>
      </main>
    );
  }

  // ── STATUS: CANCELLED ─────────────────────────────────────────────────────
  if (invoice.status === "CANCELLED") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Invoice Dibatalkan</h1>
          <p className="text-slate-600">Invoice ini sudah tidak aktif. Hubungi tim kami untuk informasi lebih lanjut.</p>
        </div>
      </main>
    );
  }

  // ── STATUS: PENDING — show checkout form ──────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-600 tracking-widest uppercase mb-1">
            SpeakUp Center
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Form Pendaftaran & Pembayaran</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Isi data diri dan unggah bukti transfer Anda.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Rincian Tagihan
            </span>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-t border-slate-100">
            <span className="text-slate-600">Program</span>
            <span className="font-semibold text-slate-800">{(invoice as any).program?.name}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-t border-slate-100">
            <span className="text-slate-600">Nama Calon Siswa</span>
            <span className="font-semibold text-slate-800">{invoice.lead.name}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-t border-slate-100">
            <span className="text-slate-600">Total Harga Program</span>
            <span className="font-semibold text-slate-800">{totalAmountFormatted}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-t border-slate-100">
            <span className="text-slate-600">Total Pembayaran Saat Ini</span>
            <span className="text-2xl font-bold text-indigo-700">{paidAmountFormatted}</span>
          </div>
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
            <p className="font-semibold mb-1">Transfer ke:</p>
            <p>🏦 BCA — <strong>1234567890</strong> a/n SpeakUp Center</p>
          </div>
        </div>

        {/* Form */}
        <CheckoutForm
          invoiceId={invoice.id}
          program={(invoice as any).program}
          leadName={invoice.lead.name}
          leadWa={invoice.lead.whatsapp}
        />
      </div>
    </main>
  );
}
