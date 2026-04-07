import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { cookies } from "next/headers";
import { BranchLocation } from "@prisma/client";
import { AdminSidebar } from "./AdminSidebar";
import { getActiveBranch } from "@/lib/actions/branch-actions";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", emoji: "📊" },
  { label: "Classes", href: "/admin/classes", emoji: "📚" },
  { label: "Users", href: "/admin/users", emoji: "👥" },
  { label: "Announcements", href: "/admin/announcements", emoji: "📢" },
  { label: "Payroll", href: "/admin/payroll", emoji: "💰" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const activeBranch = await getActiveBranch();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      <AdminSidebar
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role,
        }}
        activeBranch={activeBranch}
      />
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
