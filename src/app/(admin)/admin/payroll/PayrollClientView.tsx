"use client";

import { CreditCard, CalendarDays, Receipt, Clock } from "lucide-react";

type PayrollItem = {
  id: string;
  name: string;
  totalSessions: number;
  totalPay: number;
  status: string;
};

export function PayrollClientView({ payrollData }: { payrollData: PayrollItem[] }) {
  // Get current month name for the mockup UI
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Formatting function string Rp
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" /> Tutor Payroll
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Flat rate compensation algorithm (Rp 30.000 / completed session).
          </p>
        </div>
        
        {/* Mockup Bulan Dropdown */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:bg-slate-100 transition-colors">
          <CalendarDays className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{currentMonthName}</span>
        </div>
      </div>

      {/* 2. Payroll Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full text-left overflow-x-auto">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Tutor Name</th>
                <th className="px-6 py-4">Completed Sessions <span className="text-slate-400 normal-case font-medium">(This Month)</span></th>
                <th className="px-6 py-4">Total Pay</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/30">
                    No active tutors found.
                  </td>
                </tr>
              ) : (
                payrollData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{item.totalSessions} <span className="font-medium text-slate-500">sessions</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-lg font-bold text-slate-900 tracking-tight">
                        {formatRupiah(item.totalPay)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {item.status === "Pending" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                          <Receipt className="w-3.5 h-3.5"/> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm w-[100px]">
                          No Pay
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info Summary */}
        <div className="bg-slate-50/80 p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm font-medium text-slate-500">
            Showing payroll data for {payrollData.length} tutors.
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-4">
            <span className="text-slate-500">Total Company Expense:</span>
            <span className="text-lg text-emerald-600">
              {formatRupiah(payrollData.reduce((acc, curr) => acc + curr.totalPay, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
