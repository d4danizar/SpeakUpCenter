"use server";

import { prisma } from "@/lib/prisma";
import { eachDayOfInterval, format } from "date-fns";
import * as XLSX from "xlsx";
import { getBranchFilter } from "@/lib/actions/branch-actions";

// Helper function untuk menghitung range tanggal
function getDateRange(timeframe: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (timeframe === "last_month") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (timeframe === "this_year") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    // Default: this_month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { startDate, endDate };
}

// 1. UPDATE fungsi getDashboardData agar menerima parameter timeframe
export async function getDashboardData(timeframe: string = "this_month") {
  try {
    const { startDate, endDate } = getDateRange(timeframe);
    const branchFilter = await getBranchFilter();

    // 1. Ambil data Lead masuk
    const leadsIn = await prisma.lead.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });

    // 2. Ambil data Closing (Lead yang menang)
    const leadsClosed = await prisma.lead.findMany({
      where: {
        ...branchFilter,
        status: "CLOSED_WON",
        updatedAt: { gte: startDate, lte: endDate } 
      },
      select: { updatedAt: true }
    });

    // 3. Ambil total Revenue dari uang masuk kategori akademi (DP & PELUNASAN)
    const revenueFlows = await prisma.cashflow.findMany({
      where: {
        ...branchFilter,
        type: "INCOME",
        category: { in: ["DP", "PELUNASAN"] },
        date: { gte: startDate, lte: endDate }
      },
      select: { amount: true, date: true }
    });

    // Kalkulasi Totals
    const totalLeads = leadsIn.length;
    const totalClosing = leadsClosed.length;
    const totalRevenue = revenueFlows.reduce((acc, curr) => acc + curr.amount, 0);

    // Bangun Timeline (Jika timeframe = this_year, akan ada 365 hari yang di-plot)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const chartData = days.map((day) => {
      // Gunakan format "dd MMM" untuk harian, tapi jika datanya tahunan (this_year) Recharts akan tetap mengecilkannya.
      const dateStr = format(day, timeframe === "this_year" ? "MMM dd" : "dd MMM");
      
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dailyLeads = leadsIn.filter(l => l.createdAt >= dayStart && l.createdAt <= dayEnd).length;
      const dailyClosing = leadsClosed.filter(l => l.updatedAt >= dayStart && l.updatedAt <= dayEnd).length;
      const dailyRevenue = revenueFlows
        .filter(r => r.date >= dayStart && r.date <= dayEnd)
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        date: dateStr,
        leads: dailyLeads,
        closing: dailyClosing,
        revenue: dailyRevenue
      };
    });

    return {
      success: true,
      data: {
        totals: {
          leads: totalLeads,
          closing: totalClosing,
          revenue: totalRevenue
        },
        chartData
      }
    };

  } catch (error: any) {
    console.error("Failed to fetch dashboard data:", error);
    return { error: "Terjadi kesalahan saat merekap data." };
  }
}

// 2. BUAT FUNGSI BARU untuk EXPORT RAW DATA (Server Base 64 string generator)
export async function exportRawDashboardData(timeframe: string = "this_month") {
  const { startDate, endDate } = getDateRange(timeframe);
  const branchFilter = await getBranchFilter();

  try {
    // A. Ambil Data Leads
    const leads = await prisma.lead.findMany({
      where: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } },
      select: { name: true, whatsapp: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    // B. Ambil Data Closing (Misal dari Invoice PAID/DP_PAID)
    const closings = await prisma.invoice.findMany({
      where: { 
        ...branchFilter,
        status: { in: ["PAID", "DP_PAID"] },
        updatedAt: { gte: startDate, lte: endDate }
      },
      select: { programName: true, totalAmount: true, paidAmount: true, paymentMethod: true, updatedAt: true, lead: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    // C. Ambil Data Revenue (Cashflow INCOME) DP dan PELUNASAN Validasi
    const revenues = await prisma.cashflow.findMany({
      where: {
        type: "INCOME",
        category: { in: ["DP", "PELUNASAN"] },
        date: { gte: startDate, lte: endDate }
      },
      select: { description: true, amount: true, date: true },
      orderBy: { date: 'desc' }
    });

    // D. Mapping Logika Rapi XLSX
    const formattedLeads = leads.map((l: any) => ({
      "Tanggal": new Date(l.createdAt).toLocaleDateString("id-ID"),
      "Nama Lead": l.name,
      "No. WhatsApp": l.whatsapp,
      "Status": l.status
    }));

    const formattedClosings = closings.map((c: any) => ({
      "Tanggal Closing": new Date(c.updatedAt).toLocaleDateString("id-ID"),
      "Nama Siswa": c.lead?.name || "-",
      "Program": c.programName,
      "Metode Bayar": c.paymentMethod,
      "Total Tagihan": c.totalAmount,
      "Nominal Dibayar": c.paidAmount
    }));

    const formattedRevenues = revenues.map((r: any) => ({
      "Tanggal Masuk": new Date(r.date).toLocaleDateString("id-ID"),
      "Keterangan": r.description,
      "Nominal (Rp)": r.amount
    }));

    // E. Assemble Workbook Stream
    const wb = XLSX.utils.book_new();

    const wsLeads = XLSX.utils.json_to_sheet(formattedLeads);
    XLSX.utils.book_append_sheet(wb, wsLeads, "Data Leads");

    const wsClosing = XLSX.utils.json_to_sheet(formattedClosings);
    XLSX.utils.book_append_sheet(wb, wsClosing, "Data Closing");

    const wsRevenue = XLSX.utils.json_to_sheet(formattedRevenues);
    XLSX.utils.book_append_sheet(wb, wsRevenue, "Data Pendapatan");

    // Convert workbook to base64
    const base64Data = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    return { success: true, file: base64Data };
  } catch (error) {
    console.error("Export Error:", error);
    return { error: "Gagal menarik data export." };
  }
}
