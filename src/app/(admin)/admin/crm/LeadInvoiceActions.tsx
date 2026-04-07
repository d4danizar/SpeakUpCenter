"use client";

import { useState, useTransition } from "react";
import { createInvoice, approvePayment, settlePaymentOnSite } from "../../../../lib/actions/invoice-actions";
import { ExternalLink, CheckCircle, Plus, Copy, X, Banknote, Link, Printer } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  programName: string;
  amountDue: number;
  totalAmount?: number;
  paidAmount?: number;
  status: string;
  paymentProof: string | null;
  studentData?: any;
};

type Lead = {
  id: string;
  name: string;
  status: string;
  invoices: Invoice[];
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PAID: { label: "✅ LUNAS", cls: "bg-emerald-100 text-emerald-700" },
  DP_PAID: { label: "💰 DP Lunas", cls: "bg-teal-100 text-teal-700" },
  WAITING_CONFIRMATION: { label: "⏳ Menunggu Verifikasi", cls: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "❌ Batal", cls: "bg-red-100 text-red-600" },
  PENDING: { label: "🕐 PENDING", cls: "bg-slate-100 text-slate-600" },
};

export function LeadInvoiceActions({ lead, programs }: { lead: Lead, programs: any[] }) {
  const [isPending, startTransition] = useTransition();

  // Modal: generate link
  const [showModal, setShowModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"DP" | "FULL">("DP");
  const [programId, setProgramId] = useState(programs.length > 0 ? programs[0].id : "");
  const [dpAmount, setDpAmount] = useState("");

  // After creation
  const [newInvoiceUrl, setNewInvoiceUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Approval / Review Modal
  const [verifyModalInv, setVerifyModalInv] = useState<Invoice | null>(null);
  const [approveMsg, setApproveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreateInvoice = 
    ["NEGOTIATION", "CLOSED_WON"].includes(lead.status) &&
    !lead.invoices.some((i) => ["DP_PAID", "PAID", "WAITING_CONFIRMATION"].includes(i.status));

  const pendingInvoice = lead.invoices.find(
    (i) => i.status === "WAITING_CONFIRMATION"
  );
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      setError("Pilih program.");
      return;
    }
    
    let parsedDp = 0;
    if (paymentType === "DP") {
      parsedDp = parseFloat(dpAmount);
      if (isNaN(parsedDp) || parsedDp <= 0) {
        setError("Isi nominal DP dengan benar.");
        return;
      }
    }

    setError(null);

    startTransition(async () => {
      const res = await createInvoice(lead.id, programId, paymentType, parsedDp);
      if (res.error) {
        setError(res.error);
      } else if (res.invoiceNumber) {
        setNewInvoiceUrl(`${baseUrl}/pay/${res.invoiceNumber}`);
        setShowModal(false);
        setDpAmount("");
      }
    });
  };

  const handleApprove = (invoiceId: string) => {
    startTransition(async () => {
      const res = await approvePayment(invoiceId);
      if (res.error) setError(res.error);
      else if (res.message) {
        setVerifyModalInv(null);
        setApproveMsg(res.message);
      }
    });
  };

  const handleSettleOnSite = (invoiceId: string) => {
    if (!confirm("Konfirmasi pelunasan tagihan secara on-site (Tunai/EDC)?")) return;
    startTransition(async () => {
      const res = await settlePaymentOnSite(invoiceId);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-1">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Generated link banner */}
      {newInvoiceUrl && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
          <a
            href={newInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-700 font-medium truncate flex-1"
          >
            <ExternalLink className="inline w-3 h-3 mr-1" />
            {newInvoiceUrl}
          </a>
          <button
            onClick={() => handleCopy(newInvoiceUrl)}
            className="shrink-0 text-indigo-600 hover:text-indigo-800 font-xs"
            title="Copy link"
          >
            {copied ? (
              <span className="text-xs text-emerald-600 font-semibold">✓</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Existing invoices list */}
      {lead.invoices.map((inv) => {
        const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.PENDING;
        return (
          <div key={inv.id} className="flex flex-col gap-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold ${badge.cls}`}>
                {badge.label}
              </span>
              <span className="text-slate-500 font-mono flex-1">{inv.invoiceNumber}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy(`${baseUrl}/pay/${inv.invoiceNumber}`);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {(inv.status === "PAID" || inv.status === "DP_PAID") && (
                <a
                  href={`/invoice/print/${inv.id}`}
                  target="_blank"
                  className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                  title="Cetak Kuitansi"
                >
                  <Printer className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* If DP_PAID, show pelunasan actions */}
            {inv.status === "DP_PAID" && (
              <div className="flex gap-2 pl-1 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSettleOnSite(inv.id);
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-md text-[10px] font-semibold transition-colors disabled:opacity-50"
                  title="Pelunasan On-Site / Tunai"
                >
                  <Banknote className="w-3 h-3 text-emerald-600" />
                  Lunas On-Site
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = `${window.location.origin}/pay/pelunasan/${inv.invoiceNumber}`;
                    navigator.clipboard.writeText(url);
                    alert("Link Pelunasan berhasil disalin!");
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-md text-[10px] font-semibold transition-colors"
                  title="Copy link form pelunasan untuk ditransfer"
                >
                  <Link className="w-3 h-3 text-indigo-600" />
                  Link Pelunasan
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Verify payment button */}
      {pendingInvoice && (
        <button
          onClick={() => setVerifyModalInv(pendingInvoice)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 w-fit"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Verifikasi Pembayaran
        </button>
      )}

      {/* Generate link button */}
      {canCreateInvoice && (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Link Pendaftaran
        </button>
      )}

      {/* ── Generate Link Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  🔗 Generate Link Pendaftaran
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  {lead.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="p-5 flex flex-col gap-4">
                {/* Payment type */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Jenis Tagihan
                  </label>
                  <div className="flex gap-3">
                    {(["DP", "FULL"] as const).map((pt) => (
                      <label
                        key={pt}
                        className={`flex-1 flex items-center gap-2.5 px-4 py-3 border-2 rounded-xl cursor-pointer transition-colors ${
                          paymentType === pt
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value={pt}
                          checked={paymentType === pt}
                          onChange={() => setPaymentType(pt)}
                          className="accent-indigo-600"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {pt === "DP" ? "Down Payment (DP)" : "Pelunasan (Full)"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {pt === "DP" ? "Bayar sebagian dulu" : "Bayar lunas sekarang"}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Program */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Program
                  </label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                     className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 text-slate-800"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Rp{p.basePrice.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount (Conditional: DP only) */}
                {paymentType === "DP" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                      Nominal DP yang dibayarkan (Rp)
                    </label>
                    <input
                      type="number"
                      value={dpAmount}
                      onChange={(e) => setDpAmount(e.target.value)}
                      required
                      min="0"
                      step="any"
                      placeholder="Contoh: 150000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isPending ? "Membuat..." : "🔗 Buat & Dapatkan Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Verify Payment Modal ─────────────────────────────────────────── */}
      {verifyModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  📋 {verifyModalInv.paidAmount && verifyModalInv.paidAmount > 0 && verifyModalInv.paidAmount < (verifyModalInv.totalAmount || 0)
                      ? "Tinjau Bukti Pembayaran (Verifikasi Pelunasan)" 
                      : "Tinjau Bukti Pembayaran (Verifikasi DP)"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {verifyModalInv.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setVerifyModalInv(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
              {/* Ringkasan Siswa */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3">
                  Informasi Siswa
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Nama Lengkap</div>
                  <div className="font-semibold text-slate-800">
                    {verifyModalInv.studentData?.name || "-"}
                  </div>
                  <div className="text-slate-500">Program</div>
                  <div className="font-semibold text-slate-800">
                    {verifyModalInv.studentData?.program || (verifyModalInv as any).program?.name}
                  </div>
                  <div className="text-slate-500">No WhatsApp</div>
                  <div className="font-semibold text-slate-800">
                    {verifyModalInv.studentData?.whatsapp || "-"}
                  </div>
                </div>
              </div>

              {/* Rincian Tagihan */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3">
                  Informasi Tagihan
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Total Harga Program</div>
                  <div className="font-semibold text-slate-800">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(verifyModalInv.totalAmount || 0)}
                  </div>
                  {/* Kondisional DP atau Pelunasan */}
                  {((verifyModalInv as any).cashflows?.length > 0) ? (
                    <>
                      <div className="text-slate-500">Nominal Pelunasan (Sisa Tagihan)</div>
                      <div className="font-semibold text-indigo-700 text-lg">
                        Rp {((verifyModalInv.totalAmount || 0) - (verifyModalInv.paidAmount || 0)).toLocaleString("id-ID")}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-500">Nominal DP Saat Ini</div>
                      <div className="font-semibold text-indigo-700 text-lg">
                        Rp {(verifyModalInv.paidAmount || 200000).toLocaleString("id-ID")}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bukti Transfer */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center justify-between">
                  <span>Foto Bukti Transfer</span>
                  {verifyModalInv.paymentProof && (
                    <a
                      href={verifyModalInv.paymentProof}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] capitalize font-medium flex items-center gap-1"
                    >
                      Buka di tab baru <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </h3>
                <div className="bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-2 min-h-[200px]">
                  {verifyModalInv.paymentProof ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={verifyModalInv.paymentProof}
                      alt="Bukti Transfer"
                      className="max-h-80 w-auto object-contain rounded-md"
                    />
                  ) : (
                    <p className="text-sm text-slate-400 font-medium my-10">
                      Bukti transfer tidak ditemukan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setVerifyModalInv(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleApprove(verifyModalInv.id)}
                disabled={isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Setujui Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve success modal ────────────────────────────────────────── */}
      {approveMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-emerald-700">
                ✅ Pembayaran Disetujui!
              </h2>
              <button
                onClick={() => setApproveMsg(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                Template Pesan WhatsApp
              </p>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {approveMsg}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(approveMsg)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy ke Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
