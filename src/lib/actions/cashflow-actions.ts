"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { getBranchFilter } from "@/lib/actions/branch-actions";

type TransactionCategory = "DP" | "PELUNASAN" | "REGISTRATION_FEE" | "OPERATIONAL" | "SALARY" | "MARKETING" | "OTHER";

export async function createManualExpense(data: {
  amount: number;
  category: TransactionCategory;
  description: string;
  date?: Date;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };

    const recordedById = (session.user as any)?.id;
    if (!recordedById) return { error: "Sesi user kadaluarsa, mohon login ulang." };

    const branchFilter = await getBranchFilter();

    const expense = await (prisma as any).cashflow.create({
      data: {
        type: "EXPENSE",
        category: data.category as any,
        amount: data.amount,
        description: data.description,
        recordedById: recordedById,
        date: data.date ? new Date(data.date) : new Date(),
        branch: branchFilter.branch,
      } as any, 
    });
    return { success: true, data: expense };
  } catch (error: any) {
    console.error("[createManualExpense] Error:", error?.message || error);
    return { error: `Gagal mencatat pengeluaran manual: ${error?.message || "Kesalahan Server"}` };
  }
}

export async function getFinanceStats(startDateStr: string, endDateStr: string) {
  try {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const branchFilter = await getBranchFilter();

    const transactions = await (prisma as any).cashflow.findMany({
      where: { ...branchFilter, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
      include: {
        recordedBy: { select: { name: true } },
        invoice: { select: { invoiceNumber: true } }
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const grouped: Record<string, { date: string; income: number; expense: number; sortKey: number }> = {};

    transactions.forEach((t: any) => {
      if (t.type === "INCOME") totalIncome += t.amount;
      else totalExpense += t.amount;

      const dayStr = new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      if (!grouped[dayStr]) {
        grouped[dayStr] = { date: dayStr, income: 0, expense: 0, sortKey: new Date(t.date).getTime() };
      }

      if (t.type === "INCOME") grouped[dayStr].income += t.amount;
      else grouped[dayStr].expense += t.amount;
    });

    const chartData = Object.values(grouped).sort((a: any, b: any) => a.sortKey - b.sortKey);

    return { 
      success: true, 
      totalIncome, 
      totalExpense, 
      netProfit: totalIncome - totalExpense, 
      chartData, 
      transactions 
    };
  } catch (err) {
    console.error("[getFinanceStats]", err);
    return { error: "Gagal mengambil statistik keuangan." };
  }
}


export async function getRecentTransactions() {
  try {
    const branchFilter = await getBranchFilter();

    const transactions = await (prisma as any).cashflow.findMany({
      where: { ...branchFilter },
      take: 20,
      orderBy: { date: "desc" },
      include: {
        recordedBy: { select: { name: true } },
        invoice: { select: { invoiceNumber: true } }
      },
    });
    return { success: true, transactions };
  } catch (err) {
    console.error("[getRecentTransactions]", err);
    return { error: "Gagal mengambil transaksi terbaru." };
  }
}
