"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, DollarSign, Activity, AlertCircle, DownloadCloud } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardData, exportRawDashboardData } from "@/lib/actions/dashboard-actions";

type ChartType = "revenue" | "leads" | "closing";

type DashboardData = {
  totals: {
    leads: number;
    closing: number;
    revenue: number;
  };
  chartData: any[]; // Array of {date, leads, closing, revenue}
};

export default function DashboardClient() {
  const [activeChart, setActiveChart] = useState<ChartType>("revenue");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("this_month");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      const res = await getDashboardData(timeframe);
      
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    
    loadData();
  }, [timeframe]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const base64Data = await exportRawDashboardData(timeframe); // Panggil server action
      if (!base64Data || base64Data.error || !base64Data.file) {
        alert("Gagal mengunduh data.");
        setIsDownloading(false);
        return;
      }

      // Convert base64 ke Blob
      const realBase64 = base64Data.file;
      const byteCharacters = atob(realBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Buat link download HTML trigger
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Bisnis_${timeframe}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengekspor.");
    } finally {
      setIsDownloading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRupiahCompact = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const timeframeLabels: Record<string, string> = {
    "this_month": "Bulan Ini",
    "last_month": "Bulan Lalu",
    "this_year": "Tahun Ini"
  };

  // UI mapping for dynamic chart properties based on active tab
  const chartConfig = {
    revenue: {
      key: "revenue",
      color: "#10b981", // Emerald-500
      stroke: "#059669", // Emerald-600
      title: "Gross Revenue",
      formatter: (val: number) => formatCurrency(val)
    },
    leads: {
      key: "leads",
      color: "#3b82f6", // Blue-500
      stroke: "#2563eb", // Blue-600
      title: "Total Leads In",
      formatter: (val: number) => val.toString() + " Leads"
    },
    closing: {
      key: "closing",
      color: "#6366f1", // Indigo-500
      stroke: "#4f46e5", // Indigo-600
      title: "Total Closing",
      formatter: (val: number) => val.toString() + " Won"
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      
      {/* Filters and Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="timeframe" className="text-sm font-semibold text-slate-600 whitespace-nowrap">Rentang Waktu:</label>
          <select 
            id="timeframe"
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-medium"
          >
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading || isLoading}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2 text-sm
            ${(isDownloading || isLoading) ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 hover:shadow-md"}`}
        >
          {isDownloading ? (
             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <DownloadCloud className="w-4 h-4" />
          )}
          {isDownloading ? "Mengunduh..." : "Unduh Semua Data (.xlsx)"}
        </button>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEADS CARD */}
        <button
          onClick={() => setActiveChart("leads")}
          className={`text-left text-slate-900 bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all group hover:shadow-md flex-1
            ${activeChart === "leads" ? "border-blue-500 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-300"}`}
        >
          <div className={`p-4 rounded-xl transition-colors ${activeChart === "leads" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"}`}>
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1 leading-none uppercase tracking-wider">{timeframeLabels[timeframe]}</p>
            <p className="text-sm font-bold text-slate-700">Total Leads In</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-black">{data?.totals.leads || 0}</p>
            )}
          </div>
        </button>

        {/* CLOSING CARD */}
        <button
          onClick={() => setActiveChart("closing")}
          className={`text-left text-slate-900 bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all group hover:shadow-md flex-1
            ${activeChart === "closing" ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
        >
          <div className={`p-4 rounded-xl transition-colors ${activeChart === "closing" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"}`}>
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1 leading-none uppercase tracking-wider">{timeframeLabels[timeframe]}</p>
            <p className="text-sm font-bold text-slate-700">Total Closing</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-black">{data?.totals.closing || 0}</p>
            )}
          </div>
        </button>

        {/* REVENUE CARD */}
        <button
          onClick={() => setActiveChart("revenue")}
          className={`text-left text-slate-900 bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all group hover:shadow-md flex-1
            ${activeChart === "revenue" ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-200 hover:border-emerald-300"}`}
        >
          <div className={`p-4 rounded-xl transition-colors ${activeChart === "revenue" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200"}`}>
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1 leading-none uppercase tracking-wider">{timeframeLabels[timeframe]}</p>
            <p className="text-sm font-bold text-slate-700">Gross Revenue</p>
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p 
                className="text-3xl font-black truncate" 
                title={formatCurrency(data?.totals.revenue || 0)}
              >
                {formatRupiahCompact(data?.totals.revenue || 0)}
              </p>
            )}
          </div>
        </button>

      </div>

      {/* Chart Render Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[450px]">
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
           <Activity className="w-6 h-6 text-slate-400" />
           <h2 className="text-xl font-bold text-slate-800">
             Tren {chartConfig[activeChart].title} ({timeframeLabels[timeframe]})
           </h2>
        </div>

        {isLoading ? (
          <div className="w-full h-[350px] bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
            <span className="text-slate-400 font-medium tracking-wide">Menyiapkan Grafik...</span>
          </div>
        ) : data && data.chartData.length > 0 ? (
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig[activeChart].color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={chartConfig[activeChart].color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 13 }}
                  dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748B', fontSize: 13 }}
                   tickFormatter={(val) => {
                     // Shorten large currency numbers for Y-axis (e.g. 1000000 -> 1M)
                     if (activeChart === "revenue") {
                        if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
                        if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
                        return `Rp ${val}`;
                     }
                     return val;
                   }}
                   dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}
                  formatter={(value: number) => [chartConfig[activeChart].formatter(value), chartConfig[activeChart].title]}
                />
                <Area 
                  type="monotone" 
                  dataKey={chartConfig[activeChart].key} 
                  stroke={chartConfig[activeChart].stroke} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={`url(#gradient-${activeChart})`} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: chartConfig[activeChart].stroke }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-[350px] bg-slate-50 border border-slate-100 border-dashed rounded-xl flex items-center justify-center flex-col text-slate-400">
             <Activity className="w-8 h-8 mb-3 opacity-20" />
             <p>Tidak ada data {chartConfig[activeChart].title.toLowerCase()} untuk rentang waktu ini.</p>
          </div>
        )}
      </div>

    </div>
  );
}
