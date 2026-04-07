import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Business Dashboard | Super Admin",
  description: "Executive business metrics and growth charts",
};

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);

  // Gating access strictly to SUPER_ADMIN
  if (!session?.user || (session.user.role as string) !== "SUPER_ADMIN") {
    redirect("/admin/crm");
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Business Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Executive overview of company revenue, sales pipelines, and core metrics. <strong className="text-slate-700">EKSKLUSIF SUPER ADMIN</strong>.
        </p>
      </div>

      <DashboardClient />
    </div>
  );
}
