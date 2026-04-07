"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { COMPANY_INFO } from "@/lib/constants/branding";
import { BranchLocation } from "@prisma/client";

// Standard ops items accessible to all admin roles
const standardNavItems = [
  { label: "Classes", href: "/admin/classes", emoji: "📚" },
  { label: "Users", href: "/admin/users", emoji: "👥" },
  { label: "Announcements", href: "/admin/announcements", emoji: "📢" },
  { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
  { label: "Pengaturan", href: "/admin/settings", emoji: "⚙️" },
];

// Role-gated helpers
const CRM_ROLES = ["SUPER_ADMIN", "CS", "MARKETING"];
const KPI_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR"];

export function AdminSidebar({
  user,
  activeBranch,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null };
  activeBranch: BranchLocation;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const role = (user?.role ?? "") as string;

  let visibleNavItems: any[] = [];

  if (role === "STUDENT") {
    visibleNavItems = [
      { label: "Dashboard", href: "/student/dashboard", emoji: "📊" },
      { label: "My Classes", href: "/student/classes", emoji: "📚" },
      { label: "Invoices", href: "/student/invoices", emoji: "💳" },
      { label: "Settings", href: "/student/settings", emoji: "⚙️" },
    ];
  } else if (role === "TUTOR") {
    visibleNavItems = [
      { label: "Schedules", href: "/tutor/dashboard", emoji: "🗓️" },
      { label: "Evaluations", href: "/tutor/evaluations", emoji: "⭐" },
      { label: "Payroll", href: "/tutor/payroll", emoji: "💰" },
      { label: "Pengaturan", href: "/tutor/settings", emoji: "⚙️" },
    ];
  } else {
    // Admin roles filtering
    visibleNavItems = [
      ...(role === "SUPER_ADMIN" ? [{ label: "Dashboard Bisnis", href: "/admin/dashboard", emoji: "📊" }] : []),
      ...(["SUPER_ADMIN", "MANAGER", "CS"].includes(role) ? [{ label: "Keuangan", href: "/admin/finance", emoji: "💰" }] : []),
      ...(CRM_ROLES.includes(role) ? [{ label: "CRM", href: "/admin/crm", emoji: "🤝" }] : []),
      ...(KPI_ROLES.includes(role) ? [{ label: "KPI & WIG", href: "/admin/kpi", emoji: "🎯" }] : []),
      ...standardNavItems,
    ];
  }

  return (
    <>
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo-icon.png" alt="SpeakUp Center Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-white font-extrabold text-base tracking-wider leading-tight">
            SPEAKUP
            <span className="block text-blue-400 font-medium text-[10px] tracking-widest mt-0.5">
              CENTER
            </span>
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer block"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5 pointer-events-none" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in cursor-pointer block"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] min-w-[260px] bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:overflow-y-auto md:translate-x-0 border-r border-slate-800 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex justify-between items-center h-20 px-6 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="SpeakUp Center Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-white font-extrabold text-lg tracking-wider leading-tight m-0">
              SPEAKUP
              <span className="block text-blue-400 font-medium text-sm tracking-widest mt-0.5">
                CENTER
              </span>
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors cursor-pointer block"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Branch Switcher Lobotomy: Removed */}

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 bg-slate-900">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group no-underline ${
                  isActive
                    ? "bg-slate-800 text-white border-l-4 border-blue-500 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform block">
                  {item.emoji}
                </span>
                <span className="block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex justify-center items-center text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium m-0 truncate leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-400 m-0 truncate mt-0.5 leading-tight">
                {user?.email || "User Email"}
              </p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-rose-500/10 transition-colors no-underline w-full group"
          >
            <span className="block group-hover:scale-110 transition-transform">🚪</span>
            <span className="block">Sign Out</span>
          </Link>

          {/* SaaS Footer Credit */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
             <p className="text-[10px] text-slate-500 font-medium tracking-wide">
               Powered by <span className="font-bold text-slate-400">dspaceweb</span>
             </p>
          </div>
        </div>
      </aside>
    </>
  );
}
