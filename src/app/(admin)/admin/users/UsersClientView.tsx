"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { addDays, addMonths, format } from "date-fns";
import { 
  Users, 
  Search, 
  Download, 
  Plus, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen,
  MoreVertical,
  X,
  Loader2,
  Pencil,
  Key,
  Trash2,
  RefreshCcw
} from "lucide-react";
import { createUser, editUser, resetPassword, deleteUser } from "./actions";
import { ActionDropdown } from "../../../../components/ui/ActionDropdown";

type UserType = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  branch: string;
  status: string;
  createdAt: string;
  activeProgram: string;
  programBatch: string | null;
  startDate: string | null;
  endDate: string | null;
  durationOption: string | null;
  batchSchedule: string | null;
};

// Shared endDate calculation logic (used by both Add and Edit forms)
function calculateEndDate(program: string, startDate: string, duration: string): Date | null {
  if (!startDate || !program) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  switch (program) {
    case "Regular":
      return addDays(start, 25);
    case "Fullday":
    case "Asrama": {
      if (!duration) return null;
      switch (duration) {
        case "1_WEEK":   return addDays(start, 5);
        case "2_WEEKS":  return addDays(start, 12);
        case "3_WEEKS":  return addDays(start, 19);
        case "1_MONTH":  return addDays(start, 26);
        case "2_MONTHS": return addDays(start, 54);
        default: return null;
      }
    }
    case "English on Saturday":
      return addDays(start, 49);
    case "EFT":
    case "EFK":
      return addMonths(start, 6);
    default:
      return null;
  }
}

export function UsersClientView({ 
  initialUsers,
  activeBranch,
  programs = [],
}: { 
  initialUsers: UserType[];
  activeBranch?: string;
  programs?: { id: string; name: string }[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "TUTOR" | "STUDENT">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // === ADD FORM STATE ===
  const [newUserRole, setNewUserRole] = useState<string>("STUDENT");
  const [formProgram, setFormProgram] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formProgramBatch, setFormProgramBatch] = useState("");

  // === EDIT FORM STATE ===
  const [editProgram, setEditProgram] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editProgramBatch, setEditProgramBatch] = useState("");
  const [editRole, setEditRole] = useState("");

  // Auto-calculate endDate for ADD form
  const calculatedEndDate = useMemo(() => {
    return calculateEndDate(formProgram, formStartDate, formDuration);
  }, [formProgram, formStartDate, formDuration]);

  // Auto-calculate endDate for EDIT form
  const editCalculatedEndDate = useMemo(() => {
    return calculateEndDate(editProgram, editStartDate, editDuration);
  }, [editProgram, editStartDate, editDuration]);

  // When editingUser changes, populate edit form state
  useEffect(() => {
    if (editingUser) {
      setEditRole(editingUser.role);
      setEditProgram(editingUser.activeProgram === "-" ? "" : editingUser.activeProgram);
      setEditStartDate(editingUser.startDate ? editingUser.startDate.split("T")[0] : "");
      setEditDuration(editingUser.durationOption || "");
      setEditBatch(editingUser.batchSchedule || "");
      setEditProgramBatch(editingUser.programBatch || "");
    }
  }, [editingUser]);

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("id", editingUser!.id);

    // Append calculated student fields
    if (editRole === "STUDENT") {
      if (editCalculatedEndDate) {
        formData.set("endDate", editCalculatedEndDate.toISOString());
      }
      if (editDuration) formData.set("durationOption", editDuration);
      if (editBatch) formData.set("batchSchedule", editBatch);
      if (editProgramBatch) formData.set("programBatch", editProgramBatch);
    }
    
    startTransition(async () => {
      const res = await editUser(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("User successfully updated!");
        setEditingUser(null);
      }
    });
  };

  const handleMakeAlumni = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin meluluskan murid ${name}? Statusnya akan diubah menjadi ALUMNI.`)) {
      startTransition(async () => {
        const { updateStudentStatus } = await import("./actions");
        const res = await updateStudentStatus(id, "ALUMNI");
        if (res.error) alert(res.error);
        else alert("Murid berhasil diluluskan!");
      });
    }
  };

  const handleReactivate = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin mereaktivasi murid ${name}? Statusnya akan dikembalikan menjadi ACTIVE.`)) {
      startTransition(async () => {
        const { updateStudentStatus } = await import("./actions");
        const res = await updateStudentStatus(id, "ACTIVE");
        if (res.error) alert(res.error);
        else alert("Murid berhasil diaktifkan kembali!");
      });
    }
  };

  const handleResetPassword = (id: string) => {
    if (window.confirm("Are you sure you want to reset this user's password to default ('kampunginggris123')?")) {
      startTransition(async () => {
        const res = await resetPassword(id);
        if (res.error) alert(res.error);
        else {
          alert("Password successfully reset to default.");
        }
      });
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`CRITICAL: Are you absolutely sure you want to delete ${name}?\n\nThis will also delete their attendances and enrollments. This cannot be undone.`)) {
      startTransition(async () => {
        const res = await deleteUser(id);
        if (res.error) alert(res.error);
      });
    }
  };

  const resetAddForm = () => {
    setNewUserRole("STUDENT");
    setFormProgram("");
    setFormStartDate("");
    setFormDuration("");
    setFormBatch("");
    setFormProgramBatch("");
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Append calculated fields
    if (calculatedEndDate) {
      formData.set("endDate", calculatedEndDate.toISOString());
    }
    if (formDuration) formData.set("durationOption", formDuration);
    if (formBatch) formData.set("batchSchedule", formBatch);
    if (formProgramBatch) formData.set("programBatch", formProgramBatch);
    
    startTransition(async () => {
      const res = await createUser(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("User successfully added!");
        setIsAddModalOpen(false);
        resetAddForm();
      }
    });
  };

  // Filter users based on tab and search query
  const filteredUsers = initialUsers.filter((user) => {
    const matchesTab = activeTab === "ALL" || user.role === activeTab;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // State for export
  const [isExporting, setIsExporting] = useState(false);

  // Client-side Excel Export logic
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Lazy load xlsx to avoid huge bundle payload initially
      const XLSX = await import("xlsx");
      const { getExportStudentsData } = await import("./export-actions");

      const res = await getExportStudentsData();
      if (!res?.success || !res?.data) {
        throw new Error(res?.error || "Gagal mengambil data dari server");
      }

      const worksheet = XLSX.utils.json_to_sheet(res.data);

      // Sizing columns for anti-dempet
      worksheet["!cols"] = [
        { wch: 25 }, // Nomor Invoice
        { wch: 15 }, // Status
        { wch: 25 }, // Nama Lengkap
        { wch: 30 }, // Email
        { wch: 18 }, // No. WA
        { wch: 15 }, // Jenis Kelamin
        { wch: 25 }, // TTL
        { wch: 15 }, // Aktivitas
        { wch: 20 }, // Tahu dari Mana
        { wch: 25 }, // Program
        { wch: 25 }, // Detail Kelas
        { wch: 18 }, // Jenis Pembayaran
        { wch: 15 }, // Total Harga
        { wch: 15 }, // Nominal Dibayar
        { wch: 15 }, // Tanggal
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
      XLSX.writeFile(workbook, "Data_Siswa_KampungInggris.xlsx");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><ShieldCheck className="w-3 h-3"/> Super Admin</span>;
      case "MANAGER":
        return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><ShieldCheck className="w-3 h-3"/> Manager</span>;
      case "CS":
        return <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><ShieldCheck className="w-3 h-3"/> CS</span>;
      case "MARKETING":
        return <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><ShieldCheck className="w-3 h-3"/> Marketing</span>;
      case "CREATOR":
        return <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><ShieldCheck className="w-3 h-3"/> Creator</span>;
      case "TUTOR":
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><BookOpen className="w-3 h-3"/> Tutor</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"><GraduationCap className="w-3 h-3"/> Student</span>;
    }
  };

  // --- Shared Student Fields Renderer (used in both Add and Edit modals) ---
  const renderStudentFields = (
    mode: "add" | "edit",
    program: string,
    setProgram: (v: string) => void,
    startDate: string,
    setStartDate: (v: string) => void,
    duration: string,
    setDuration: (v: string) => void,
    batch: string,
    setBatch: (v: string) => void,
    programBatch: string,
    setProgramBatch: (v: string) => void,
    endDate: Date | null
  ) => (
    <>
      {/* Divider */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program Details</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Active Program */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active Program</label>
        <select
          name="programId"
          value={program}
          onChange={(e) => { setProgram(e.target.value); setDuration(""); setBatch(""); setProgramBatch(""); }}
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
        >
          <option value="">Select program...</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      {program && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900"
          />
        </div>
      )}

      {/* Session/Jam — Regular only */}
      {program === "Regular" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Session / Jam</label>
          <select
            value={programBatch}
            onChange={(e) => setProgramBatch(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
          >
            <option value="">Select session...</option>
            <option value="08:00 - 09:30">08:00 - 09:30</option>
            <option value="10:00 - 11:30">10:00 - 11:30</option>
            <option value="12:30 - 14:00">12:30 - 14:00</option>
            <option value="14:30 - 16:00">14:30 - 16:00</option>
            <option value="18:30 - 20:00">18:30 - 20:00</option>
          </select>
        </div>
      )}

      {/* Duration — Fullday/Asrama only */}
      {(program === "Fullday" || program === "Asrama") && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
          >
            <option value="">Select duration...</option>
            <option value="1_WEEK">1 Week</option>
            <option value="2_WEEKS">2 Weeks</option>
            <option value="3_WEEKS">3 Weeks</option>
            <option value="1_MONTH">1 Month</option>
            <option value="2_MONTHS">2 Months</option>
          </select>
        </div>
      )}

      {/* Batch Schedule — EFK/EFT only */}
      {(program === "EFK" || program === "EFT") && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Batch Schedule</label>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
          >
            <option value="">Select batch...</option>
            <option value="Senin-Rabu">Senin - Rabu</option>
            <option value="Selasa-Kamis">Selasa - Kamis</option>
            <option value="Jumat-Sabtu">Jumat - Sabtu</option>
          </select>
        </div>
      )}

      {/* Estimated End Date Preview */}
      {endDate && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Estimated End Date</p>
            <p className="text-sm font-bold text-emerald-900 mt-0.5">
              {format(endDate, "EEEE, dd MMMM yyyy")}
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> User Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage all students, tutors, and administrators.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                Mengekspor...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Data
              </>
            )}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full text-left overflow-x-auto">
        
        {/* Toolbar (Tabs & Search) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
            {(["ALL", "TUTOR", "STUDENT"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  activeTab === tab 
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "ALL" ? "All Users" : `${tab.charAt(0) + tab.slice(1).toLowerCase()}s`}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72 mt-2 md:mt-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900 shadow-sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Sesi / Batch</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/30">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</span>
                          <span className="text-xs font-medium text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {user.phoneNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="max-w-[200px] truncate" title={user.activeProgram}>
                        {user.activeProgram}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {user.programBatch || user.batchSchedule || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.status === "ALUMNI" ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                          Alumni
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {user.role === "STUDENT" && (
                          user.status === "ACTIVE" ? (
                            <button 
                              onClick={() => handleMakeAlumni(user.id, user.name)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                              <GraduationCap className="w-3.5 h-3.5" /> Luluskan
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReactivate(user.id, user.name)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )
                        )}
                        <ActionDropdown
                          disabled={isPending}
                          trigger={isPending ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <MoreVertical className="w-4 h-4" />}
                          items={[
                            {
                              label: "Edit User",
                            icon: <Pencil />,
                            onClick: () => { setEditingUser(user); }
                          },
                          {
                            label: "Reset Password",
                            icon: <Key />,
                            onClick: () => handleResetPassword(user.id)
                          },
                          {
                            label: "Delete User",
                            icon: <Trash2 />,
                            onClick: () => handleDeleteUser(user.id, user.name),
                            danger: true
                          }
                        ]}
                      />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-50/80 p-4 border-t border-slate-200 text-xs font-medium text-slate-500 text-center sm:text-left">
          Showing {filteredUsers.length} of {initialUsers.length} total users
        </div>
      </div>

      {/* ===== ADD USER MODAL ===== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
              <button 
                type="button"
                onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
                className="p-1 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex flex-col">
              <div className="p-6 flex flex-col gap-4 text-left max-h-[65vh] overflow-y-auto">
                {/* Basic Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Full Name</label>
                  <input type="text" name="name" required placeholder="e.g. John Doe" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Email Address</label>
                    <input type="email" name="email" required placeholder="e.g. john@test.com" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Phone Number</label>
                    <input type="text" name="phoneNumber" required placeholder="e.g. 08123456789" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Password</label>
                  <input type="text" name="password" required placeholder="Masukan password (minimal 6 karakter)" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Role</label>
                  <select 
                    name="role" 
                    required 
                    value={newUserRole}
                    onChange={(e) => { setNewUserRole(e.target.value); setFormProgram(""); setFormStartDate(""); setFormDuration(""); setFormBatch(""); }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TUTOR">Tutor</option>
                    <option value="CS">CS (Customer Service)</option>
                    <option value="MANAGER">Manager (SPV)</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="CREATOR">Creator</option>
                    <option value="SUPER_ADMIN">Super Admin (Owner)</option>
                  </select>
                </div>
                {/* Student-only fields */}
                {newUserRole === "STUDENT" && renderStudentFields(
                  "add", formProgram, setFormProgram, formStartDate, setFormStartDate,
                  formDuration, setFormDuration, formBatch, setFormBatch,
                  formProgramBatch, setFormProgramBatch, calculatedEndDate
                )}
              </div>
              <div className="p-5 border-t border-slate-100 gap-3 flex justify-end bg-slate-50/50">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT USER MODAL ===== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Edit User</h2>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col">
              <div className="p-6 flex flex-col gap-4 text-left max-h-[65vh] overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Full Name</label>
                  <input type="text" name="name" defaultValue={editingUser.name} required placeholder="e.g. John Doe" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Email Address</label>
                    <input type="email" name="email" defaultValue={editingUser.email} required placeholder="e.g. john@example.com" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Phone Number</label>
                    <input type="text" name="phoneNumber" defaultValue={editingUser.phoneNumber || ""} required placeholder="e.g. 08123456789" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Role</label>
                  <select 
                    name="role" 
                    value={editRole}
                    onChange={(e) => { setEditRole(e.target.value); if (e.target.value !== "STUDENT") { setEditProgram(""); setEditStartDate(""); setEditDuration(""); setEditBatch(""); setEditProgramBatch(""); } }}
                    required 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TUTOR">Tutor</option>
                    <option value="CS">CS (Customer Service)</option>
                    <option value="MANAGER">Manager (SPV)</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="CREATOR">Creator</option>
                    <option value="SUPER_ADMIN">Super Admin (Owner)</option>
                  </select>
                </div>
                {/* Student-only fields — pre-filled from existing data */}
                {editRole === "STUDENT" && renderStudentFields(
                  "edit", editProgram, setEditProgram, editStartDate, setEditStartDate,
                  editDuration, setEditDuration, editBatch, setEditBatch,
                  editProgramBatch, setEditProgramBatch, editCalculatedEndDate
                )}
              </div>
              <div className="p-5 border-t border-slate-100 gap-3 flex justify-end bg-slate-50/50">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
