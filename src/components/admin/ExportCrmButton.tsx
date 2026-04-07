"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { getAllLeadsForExport } from "@/app/(admin)/admin/crm/actions";

export function ExportCrmButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const leads = await getAllLeadsForExport();
      
      const data = leads.map((lead: any) => ({
        "Nama Lengkap": lead.name,
        "Nomor WhatsApp": lead.whatsapp,
        "Tanggal Masuk": new Date(lead.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }),
        "Status Follow Up": lead.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      
      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Data_CRM_SpeakUp_${dateStr}.xlsx`);
    } catch (error) {
      console.error("Export failed", error);
      alert("Gagal melakukan export data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
    >
      <Download className="w-5 h-5" />
      {isExporting ? "Downloading..." : "Download Data (.xlsx)"}
    </button>
  );
}
