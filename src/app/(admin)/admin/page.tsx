import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin (Owner)",
  MANAGER: "Manager (SPV)",
  CS: "Customer Service",
  MARKETING: "Marketing",
  CREATOR: "Creator",
};

const ROLE_EMOJI: Record<string, string> = {
  SUPER_ADMIN: "👑",
  MANAGER: "📋",
  CS: "🤝",
  MARKETING: "📣",
  CREATOR: "🎨",
};

const ROLE_QUICK_LINKS: Record<string, { label: string; href: string; emoji: string }[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard Bisnis", href: "/admin/dashboard", emoji: "📊" },
    { label: "CRM Leads", href: "/admin/crm", emoji: "🤝" },
    { label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" },
    { label: "Kelola Pengguna", href: "/admin/users", emoji: "👥" },
  ],
  MANAGER: [
    { label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" },
    { label: "Kelas & Jadwal", href: "/admin/classes", emoji: "📚" },
    { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
  ],
  CS: [
    { label: "CRM Leads", href: "/admin/crm", emoji: "🤝" },
    { label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" },
    { label: "Kelas & Jadwal", href: "/admin/classes", emoji: "📚" },
  ],
  MARKETING: [
    { label: "CRM Leads", href: "/admin/crm", emoji: "🤝" },
    { label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" },
  ],
  CREATOR: [
    { label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" },
  ],
};

export const metadata = {
  title: "Admin Portal",
};

export default async function AdminIndexPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as string;
  
  // Gating tambahan di level komponen untuk memastikan tidak ada non-admin yang masuk
  const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR"];
  if (!STAFF_ROLES.includes(role)) {
    redirect("/login?error=unauthorized_admin");
  }

  const name = session.user.name ?? "Admin";
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleEmoji = ROLE_EMOJI[role] ?? "🏢";
  const quickLinks = ROLE_QUICK_LINKS[role] ?? [];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500 pt-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-lg">
        <p className="text-slate-400 text-sm font-medium mb-2">Portal HRIS & CRM</p>
        <h1 className="text-3xl font-bold">
          Selamat datang, {name}! {roleEmoji}
        </h1>
        <p className="mt-2 text-slate-300">
          Dashboard operasional Anda sebagai <span className="font-semibold text-white">{roleLabel}</span> siap digunakan.
        </p>
      </div>

      {/* Quick Links */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Akses Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all text-center group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{link.emoji}</span>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 Tips</p>
        <p>Gunakan menu navigasi di sebelah kiri untuk berpindah antar modul. Akses Anda disesuaikan berdasarkan role <strong>{roleLabel}</strong> Anda.</p>
      </div>
    </div>
  );
}
