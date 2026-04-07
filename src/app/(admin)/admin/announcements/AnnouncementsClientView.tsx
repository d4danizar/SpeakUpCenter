"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Megaphone, Plus, X, Loader2, Search, Trash2, Power, PowerOff } from "lucide-react";
import { createAnnouncement, toggleAnnouncementStatus, deleteAnnouncement } from "./actions";

export type AnnouncementType = {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  authorName: string;
};

export function AnnouncementsClientView({ initialAnnouncements }: { initialAnnouncements: AnnouncementType[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAnnouncement(formData);
      if (res.error) alert(res.error);
      else {
        alert("Announcement created successfully!");
        setIsAddModalOpen(false);
      }
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleAnnouncementStatus(id, !currentStatus);
      if (res.error) alert(res.error);
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      startTransition(async () => {
        const res = await deleteAnnouncement(id);
        if (res.error) alert(res.error);
      });
    }
  };

  const filtered = initialAnnouncements.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-500" /> Announcements
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Broadcast messages to students, tutors, or all users.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full text-left overflow-x-auto">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900 shadow-sm"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Title & Message</th>
              <th className="px-6 py-4">Target Audience</th>
              <th className="px-6 py-4">Expiration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/30">No announcements found.</td></tr>
            ) : (
              filtered.map((ann) => {
                const isExpired = new Date(ann.expiresAt) < new Date();
                return (
                  <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{ann.title}</span>
                        <span className="text-xs font-medium text-slate-500 truncate max-w-sm">{ann.message}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ann.targetRole === "ALL" && <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase">Semua User</span>}
                      {ann.targetRole === "STUDENT" && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase">Murid Saja</span>}
                      {ann.targetRole === "TUTOR" && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase">Tutor Saja</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className={`flex flex-col ${isExpired ? "text-red-500" : "text-slate-600"}`}>
                        <span>{format(new Date(ann.expiresAt), "dd MMM yyyy")}</span>
                        {isExpired && <span className="text-[10px] uppercase font-bold">Expired</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(ann.id, ann.isActive)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm disabled:opacity-50 ${
                          ann.isActive 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {ann.isActive ? <><Power className="w-3.5 h-3.5" /> Active</> : <><PowerOff className="w-3.5 h-3.5" /> Hidden</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(ann.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Create Announcement</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex flex-col">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Title</label>
                  <input type="text" name="title" required placeholder="e.g. Libur Lebaran" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Message</label>
                  <textarea name="message" required rows={3} placeholder="Write the announcement..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 resize-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Target Audience</label>
                  <select name="targetRole" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900">
                    <option value="ALL">Semua User (Murid & Tutor)</option>
                    <option value="STUDENT">Khusus Murid Saja</option>
                    <option value="TUTOR">Khusus Tutor Saja</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Expires At (Hilang otomatis)</label>
                  <input type="date" name="expiresAt" required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 gap-3 flex justify-end bg-slate-50/50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : "Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
