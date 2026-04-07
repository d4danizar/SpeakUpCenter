import { prisma } from "../../../../../lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";

export const metadata = {
  title: "Cetak Kuitansi",
};

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lead: true }
  });

  if (!invoice) return notFound();

  const isDP = invoice.status === "DP_PAID";
  const title = isDP ? "KUITANSI DOWN PAYMENT (DP)" : "KUITANSI LUNAS";
  const stampText = isDP ? "DP LUNAS" : "LUNAS";
  const stampColor = isDP 
    ? "text-orange-500 border-orange-500" 
    : "text-emerald-500 border-emerald-500";

  return (
    <div id="printable-invoice" className="p-8 w-full max-w-none mx-auto bg-white text-slate-800 font-sans relative print:p-8 print:m-0">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact; 
          }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; border-bottom: none; }
        }
      `}</style>
      
      <div className="absolute top-12 right-12 z-10 pointer-events-none opacity-80 print:right-8">
        <div className={`border-4 rounded-xl border-solid px-6 py-2 text-3xl font-black tracking-widest transform -rotate-12 ${stampColor}`}>
          {stampText}
        </div>
      </div>

      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 w-full">
        <div className="flex items-center gap-4">
          <Image 
            src={COMPANY_INFO.logoSmallUrl} 
            alt="Logo" 
            width={80} 
            height={80} 
            className="object-contain"
            unoptimized
            priority
          />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{COMPANY_INFO.name}</h1>
            <p className="text-xs text-slate-500 leading-tight mb-0.5">{COMPANY_INFO.address}</p>
            <p className="text-xs text-slate-500 leading-tight">Telp: {COMPANY_INFO.phone} • {COMPANY_INFO.website}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold tracking-tight text-slate-800 leading-none">{title}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-2">
            No: <span className="font-mono text-slate-700">{invoice.invoiceNumber}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-12 mb-4">
        <div className="flex-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diterima Dari</h3>
          <p className="font-bold text-sm text-slate-800 leading-none mb-1">{invoice.lead?.name || "Siswa"}</p>
          <p className="text-xs text-slate-600 leading-none">{invoice.lead?.whatsapp || "-"}</p>
        </div>
        <div className="flex-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Bayar</h3>
          <p className="font-semibold text-sm text-slate-800 leading-none">
            {new Date(invoice.updatedAt).toLocaleDateString("id-ID", { 
              year: 'numeric', month: 'short', day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <table className="w-full text-left border-collapse mb-4">
        <thead>
          <tr className="border-y-2 border-slate-200 bg-slate-50/50">
            <th className="py-2 px-3 font-bold text-xs text-slate-600 uppercase tracking-wider">Keterangan</th>
            <th className="py-2 px-3 font-bold text-xs text-slate-600 uppercase tracking-wider text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-4 px-3 text-sm font-medium text-slate-800">{(invoice as any).programName || 'Program SpeakUp Center'}</td>
            <td className="py-4 px-3 text-sm font-bold text-right text-slate-800">
              Rp {invoice.paidAmount.toLocaleString("id-ID")}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end pt-2 border-t-2 border-slate-200">
        <div className="w-1/2">
          <div className="flex justify-between mb-2 text-slate-600 text-xs">
            <span className="font-semibold">Total Tagihan:</span>
            <span className="font-bold">Rp {invoice.totalAmount.toLocaleString("id-ID")}</span>
          </div>
          
          <div className="flex justify-between mb-2 items-center">
            <span className="font-bold text-slate-900 text-sm">Total Dibayar:</span>
            <span className="font-black text-slate-900 text-lg">Rp {invoice.paidAmount.toLocaleString("id-ID")}</span>
          </div>
          
          {isDP && (
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-200 text-orange-600 items-center bg-orange-50 p-2 rounded-lg">
              <span className="font-bold text-xs">Sisa Pelunasan:</span>
              <span className="font-black text-sm">Rp {(invoice.totalAmount - invoice.paidAmount).toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 leading-tight max-w-[60%]">
          <p className="font-semibold text-slate-700 mb-1">Catatan:</p>
          <p>Kuitansi valid oleh sistem tanpa tanda tangan basah.</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs mb-6">Penerima,</p>
          <p className="font-bold text-slate-800 border-b border-slate-800 pb-1 px-4 inline-block text-xs">Finance Dept</p>
        </div>
      </div>

      {/* Garis Potong Khusus Print */}
      <div className="hidden print:block border-t-2 border-dashed border-slate-300 mt-12 pt-4 text-center text-[10px] text-slate-400 pb-4">
        ✂️ —————————————————— Potong di sini —————————————————— ✂️
      </div>

      {/* Auto print script */}
      <script dangerouslySetInnerHTML={{ __html: 'window.onload = function() { setTimeout(function() { document.title = "' + invoice.invoiceNumber + '"; window.print(); document.title = "Invoice"; }, 500); }; window.onafterprint = function() { window.history.back(); }' }} />
    </div>
  );
}
