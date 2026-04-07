"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { getFinanceStats, createManualExpense } from "../../../../lib/actions/cashflow-actions";
import { Download, Plus, Wallet, ArrowDownRight, ArrowUpRight, Loader2, Landmark } from "lucide-react";

export function FinanceClientView() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState<{ totalIncome: number, totalExpense: number, netProfit: number, chartData: any[] }>({
    totalIncome: 0, totalExpense: 0, netProfit: 0, chartData: []
  });
  const [history, setHistory] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getFinanceStats(startDate, endDate);

    if (res?.success) {
      setStats({
        totalIncome: res.totalIncome || 0,
        totalExpense: res.totalExpense || 0,
        netProfit: res.netProfit || 0,
        chartData: res.chartData || []
      });
      setHistory(res.transactions || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      
      const res = await getFinanceStats(startDate, endDate);
      if (!res?.success || !res.transactions) {
        throw new Error(res?.error || "Gagal mengambil data untuk export.");
      }

      const rows = res.transactions.map((tx: any) => ({
        "Tanggal": new Date(tx.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        "Tipe": tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        "Kategori": tx.category.replace(/_/g, " "),
        "Ref. Invoice": tx.invoice?.invoiceNumber || "-",
        "Nominal": tx.amount,
        "Deskripsi": tx.description,
        "Pencatat": tx.recordedBy?.name || "Sistem"
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 15 }, // Tanggal
        { wch: 15 }, // Tipe
        { wch: 20 }, // Kategori
        { wch: 20 }, // Ref Invoice
        { wch: 15 }, // Nominal
        { wch: 40 }, // Deskripsi
        { wch: 20 }, // Pencatat
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
      XLSX.writeFile(workbook, `Laporan_Keuangan_${startDate}_sd_${endDate}.xlsx`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const category = formData.get("category") as any;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    
    const res = await createManualExpense({
      amount,
      category,
      description,
      date: dateStr ? new Date(dateStr) : undefined
    });

    if (res.error) {
      alert(res.error);
    } else {
      alert("Pengeluaran berhasil dicatat.");
      setIsModalOpen(false);
      loadData();
    }
    setIsSubmitting(false);
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-500" /> Laporan Keuangan
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Monitor arus kas, statistik, dan pencatatan pengeluaran.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl bg-white text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl bg-white text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-sm font-bold text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-slate-500" />}
            Unduh Excel
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                <ArrowUpRight className="w-4 h-4" /> Total Pemasukan
              </div>
              <div className="text-3xl font-black text-slate-900">{formatRupiah(stats.totalIncome)}</div>
              <div className="absolute -bottom-4 -right-4 text-emerald-500/10">
                 <ArrowUpRight className="w-32 h-32" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm uppercase tracking-wider">
                <ArrowDownRight className="w-4 h-4" /> Total Pengeluaran
              </div>
              <div className="text-3xl font-black text-slate-900">{formatRupiah(stats.totalExpense)}</div>
              <div className="absolute -bottom-4 -right-4 text-red-500/10">
                 <ArrowDownRight className="w-32 h-32" />
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm uppercase tracking-wider">
                <Wallet className="w-4 h-4" /> Profit Bersih
              </div>
              <div className={`text-3xl font-black ${stats.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatRupiah(stats.netProfit)}
              </div>
               <div className="absolute -bottom-4 -right-4 text-white/5">
                 <Wallet className="w-32 h-32" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Grafik Arus Kas ({startDate} s/d {endDate})</h3>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height={350} minHeight={350}>
                <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                  <RechartsTooltip cursor={{ stroke: "#F1F5F9", strokeWidth: 2 }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} formatter={(value: number) => formatRupiah(value)} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi Terbaru</h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Tanggal</th>
                    <th className="p-4 font-semibold">Kategori</th>
                    <th className="p-4 font-semibold">Ref. Invoice</th>
                    <th className="p-4 font-semibold">Deskripsi</th>
                    <th className="p-4 font-semibold">Pencatat</th>
                    <th className="p-4 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {history.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada transaksi di database.</td></tr>
                  ) : history.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </td>
                      <td className="p-4 text-xs font-bold whitespace-nowrap">
                        <span className={`px-2 py-1 rounded tracking-wide uppercase ${tx.type === "INCOME" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          {tx.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {tx.invoice?.invoiceNumber ? (
                           <span className="font-mono text-xs bg-slate-100 px-2 py-1 border border-slate-200 rounded">{tx.invoice.invoiceNumber}</span>
                        ) : (
                           "-"
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 max-w-sm truncate" title={tx.description}>{tx.description}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {tx.recordedBy?.name || "Sistem"}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-bold text-right whitespace-nowrap ${tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Catat Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-lg text-slate-800">Catat Pengeluaran</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                <select name="category" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-700">
                  <option value="">Pilih Kategori...</option>
                  <option value="OPERATIONAL">Akomodasi & Operasional (Listrik, Catering)</option>
                  <option value="SALARY">Gaji Tutor & Karyawan</option>
                  <option value="MARKETING">Marketing & Endorsement</option>
                  <option value="OTHER">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input type="number" name="amount" required min="1000" placeholder="Contoh: 1500000" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan / Deskripsi</label>
                <input type="text" name="description" required placeholder="Contoh: Beli spidol & papan tulis" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700" />
              </div>
              
              <div className="flex gap-3 justify-end mt-4 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
