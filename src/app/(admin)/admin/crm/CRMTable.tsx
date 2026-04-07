"use client";

import { useState } from "react";
import { Lead, LeadStatus } from "@prisma/client";
import { updateLeadStatus, deleteLead, createLead } from "./actions";
import { Plus, Trash2, Phone, MessageSquare, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { LeadInvoiceActions } from "./LeadInvoiceActions";
import { ExportCrmButton } from "@/components/admin/ExportCrmButton";

type LeadWithInvoices = Lead & {
  invoices: {
    id: string;
    invoiceNumber: string;
    program?: { id: string, name: string };
    amountDue: number;
    totalAmount?: number;
    paidAmount?: number;
    status: string;
    paymentProof: string | null;
    studentData?: any;
  }[];
};

const STATUS_FILTERS = [
  { id: "ALL", label: "Semua Lead" },
  { id: "NEW", label: "Baru" },
  { id: "FOLLOW_UP", label: "Follow Up" },
  { id: "NEGOTIATION", label: "Negosiasi" },
  { id: "CLOSED_WON", label: "Berhasil (Won)" },
  { id: "CLOSED_LOST", label: "Gagal (Lost)" },
];

export function CRMTable({ initialLeads, currentFilter, programs }: { initialLeads: LeadWithInvoices[], currentFilter: string, programs: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const res = await updateLeadStatus(leadId, newStatus as LeadStatus);
    if (!res.success) {
      alert("Gagal memperbarui status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lead ini secara permanen?")) return;
    await deleteLead(id);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    const res = await createLead({ name, whatsapp, notes });
    if (res.success) {
      setIsModalOpen(false);
      setName("");
      setWhatsapp("");
      setNotes("");
      router.refresh();
    } else {
      alert("Gagal menambahkan lead");
    }
    setIsPending(false);
  };

  const handleFilterClick = (statusFilter: string) => {
    if (statusFilter === "ALL") {
      router.push("/admin/crm");
    } else {
      router.push(`/admin/crm?status=${statusFilter}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Prospek (Leads)</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data calon siswa dari semua kanal.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <ExportCrmButton />
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-nowrap overflow-x-auto gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400 mx-2 shrink-0" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleFilterClick(s.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentFilter === s.id
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 whitespace-nowrap">Tanggal Masuk</th>
              <th className="py-4 px-6 whitespace-nowrap">Nama Prospek</th>
              <th className="py-4 px-6 whitespace-nowrap">WhatsApp</th>
              <th className="py-4 px-6 max-w-xs">Catatan</th>
              <th className="py-4 px-6 whitespace-nowrap">Status</th>
              <th className="py-4 px-6 whitespace-nowrap">Invoice</th>
              <th className="py-4 px-6 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  Tidak ada data lead ditemukan.
                </td>
              </tr>
            ) : (
              initialLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    {format(new Date(lead.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-800 whitespace-nowrap">
                    {lead.name}
                  </td>
                  <td className="py-4 px-6 font-medium whitespace-nowrap">
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 w-max"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.whatsapp}
                    </a>
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate" title={lead.notes || ""}>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 min-w-[14px] text-slate-400" />
                      <span>{lead.notes || "-"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-full outline-none cursor-pointer border-r-8 appearance-none border-transparent ${
                        lead.status === "NEW" ? "bg-blue-100 text-blue-700" :
                        lead.status === "FOLLOW_UP" ? "bg-amber-100 text-amber-700" :
                        lead.status === "NEGOTIATION" ? "bg-purple-100 text-purple-700" :
                        lead.status === "CLOSED_WON" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}
                    >
                      <option value="NEW">Baru</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="NEGOTIATION">Negosiasi</option>
                      <option value="CLOSED_WON">Berhasil (Won)</option>
                      <option value="CLOSED_LOST">Gagal (Lost)</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    <LeadInvoiceActions
                      programs={programs}
                      lead={{
                        id: lead.id,
                        name: lead.name,
                        status: lead.status,
                        invoices: lead.invoices?.map((inv: any) => ({
                          ...inv,
                          programName: inv.program?.name || 'Program Tidak Diketahui'
                        })),
                      }}
                    />
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-block"
                      title="Hapus Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Tambah Prospek Baru</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Misal: Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Misal: 081234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Awal (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                  placeholder="Ceritakan minat awal calon siswa..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
