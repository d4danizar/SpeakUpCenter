import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/ui/ChangePasswordForm";
import { User, Shield } from "lucide-react";

export const metadata = { title: "Pengaturan Akun | Admin" };

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  CS: "Customer Service",
  MARKETING: "Marketing",
  CREATOR: "Creator",
};

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  const name = session.user.name || "Admin";
  const email = session.user.email || "-";

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full animate-in fade-in duration-500 py-8 px-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">⚙️ Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight leading-none text-base">Profil</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Informasi akun Anda saat ini</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nama</p>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
            <p className="text-sm font-semibold text-slate-900">{email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Role</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
              <Shield className="w-3 h-3" />
              {ROLE_LABEL[role] || role}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <ChangePasswordForm />
    </div>
  );
}
