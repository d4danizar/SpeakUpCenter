import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { getBranchFilter } from "@/lib/actions/branch-actions";
import { AssignKpiModal } from "../../../../components/admin/AssignKpiModal";
import { AddProgressModal } from "../../../../components/admin/AddProgressModal";

const KPI_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR"];
const MANAGERIAL_ROLES = ["SUPER_ADMIN", "MANAGER"];
const STAFF_ROLES = ["MANAGER", "CS", "MARKETING", "CREATOR"];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  CS: "CS",
  MARKETING: "Marketing",
  CREATOR: "Creator",
};

const TRACKING_BADGE: Record<string, { label: string; color: string }> = {
  MANUAL: { label: "Manual", color: "bg-slate-100 text-slate-700" },
  AUTO_LEAD: { label: "Auto Lead", color: "bg-blue-100 text-blue-700" },
  AUTO_REVENUE: { label: "Auto Revenue", color: "bg-emerald-100 text-emerald-700" },
  AUTO_ATTENDANCE: { label: "Auto Hadir", color: "bg-purple-100 text-purple-700" },
};

export const metadata = { title: "KPI & WIG Dashboard" };

const getProgressPct = (current: number, target: number) =>
  target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

const getProgressColor = (pct: number) => {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-400";
  return "bg-red-400";
};

export default async function KPIPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;

  if (!session?.user || !KPI_ROLES.includes(role)) redirect("/admin");

  const isManagerial = MANAGERIAL_ROLES.includes(role);

  // ── Managerial: all targets ──────────────────────────────────────────────
  let allTargets: any[] = [];
  let staffUsers: { id: string; name: string; role: string }[] = [];

  if (isManagerial) {
    const branchFilter = await getBranchFilter();
    [allTargets, staffUsers] = await Promise.all([
      prisma.staffTarget.findMany({
        include: {
          user: { select: { id: true, name: true, role: true } },
          logs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: { in: STAFF_ROLES as any }, ...branchFilter },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      }),
    ]);
  }

  // ── Self-Reporting: own targets + logs ───────────────────────────────────
  let myTargets: any[] = [];
  if (!isManagerial) {
    myTargets = await prisma.staffTarget.findMany({
      where: { userId: session.user.id },
      include: { logs: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">🎯 KPI & WIG Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManagerial
              ? "Pantau dan distribusikan target KPI seluruh staf."
              : `Progress KPI pribadi Anda — ${ROLE_LABEL[role] ?? role}.`}
          </p>
        </div>
        {isManagerial && <AssignKpiModal users={staffUsers} />}
      </div>

      {isManagerial ? (
        /* ═══════════════════════ MANAGERIAL VIEW ════════════════════════ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-800">
              Seluruh Target Staf ({allTargets.length})
            </h2>
          </div>

          {allTargets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              Belum ada target KPI. Klik "Beri Target KPI Baru" untuk memulai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Staf</th>
                    <th className="py-3 px-5">Periode</th>
                    <th className="py-3 px-5">Target</th>
                    <th className="py-3 px-5">Metode</th>
                    <th className="py-3 px-5">Realisasi</th>
                    <th className="py-3 px-5 w-48">Progress</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Log Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTargets.map((t: any) => {
                    const pct = getProgressPct(t.currentValue, t.targetValue);
                    const badge = TRACKING_BADGE[t.trackingType] ?? TRACKING_BADGE.MANUAL;
                    const lastLog = t.logs?.[0];
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5">
                          <div className="font-semibold text-slate-800">{t.user.name}</div>
                          <div className="text-xs text-slate-400">{ROLE_LABEL[t.user.role] ?? t.user.role}</div>
                        </td>
                        <td className="py-3 px-5 font-mono text-xs text-slate-500">{t.period}</td>
                        <td className="py-3 px-5">
                          <span className="font-semibold text-slate-800">{t.targetValue.toLocaleString("id-ID")}</span>{" "}
                          <span className="text-xs text-slate-400">{t.unitName}</span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-semibold text-slate-700">
                          {t.currentValue.toLocaleString("id-ID")}{" "}
                          <span className="text-xs text-slate-400">{t.unitName}</span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 shrink-0 w-9 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          {pct >= 100 ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✅ Tercapai</span>
                          ) : pct >= 60 ? (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">🔄 On Track</span>
                          ) : (
                            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">⚠️ Perhatian</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-500">
                          {lastLog
                            ? <span>+{lastLog.valueAdded.toLocaleString("id-ID")} {t.unitName}</span>
                            : <span className="text-slate-300 italic">Belum ada</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ════════════════════ SELF-REPORTING VIEW ═══════════════════════ */
        <>
          {myTargets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-semibold text-slate-700">Belum ada target KPI untuk Anda.</p>
              <p className="text-sm text-slate-400 mt-1">Hubungi Manager / Super Admin untuk mendapatkan target bulan ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myTargets.map((t: any) => {
                const pct = getProgressPct(t.currentValue, t.targetValue);
                const badge = TRACKING_BADGE[t.trackingType] ?? TRACKING_BADGE.MANUAL;
                const isManual = t.trackingType === "MANUAL";

                // Serialize logs for client component
                const serializedLogs = (t.logs ?? []).map((l: any) => ({
                  id: l.id,
                  valueAdded: l.valueAdded,
                  notes: l.notes,
                  proofLink: l.proofLink,
                  createdAt: l.createdAt.toISOString(),
                }));

                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                        <p className="mt-2 font-bold text-slate-800">{t.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Periode: {t.period}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                        <p className={`text-xs font-semibold mt-0.5 ${pct >= 100 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          {pct >= 100 ? "✅ Tercapai" : pct >= 60 ? "🔄 On Track" : "⚠️ Perhatian"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        Realisasi:{" "}
                        <strong className="text-slate-800">
                          {t.currentValue.toLocaleString("id-ID")} {t.unitName}
                        </strong>
                      </span>
                      <span className="text-slate-400 text-xs">
                        / {t.targetValue.toLocaleString("id-ID")} {t.unitName}
                      </span>
                    </div>

                    {/* Action Buttons — only for MANUAL tracking */}
                    {isManual && (
                      <AddProgressModal
                        target={{
                          id: t.id,
                          title: t.title,
                          unitName: t.unitName,
                          targetValue: t.targetValue,
                          currentValue: t.currentValue,
                          logs: serializedLogs,
                        }}
                      />
                    )}

                    {!isManual && (
                      <p className="text-xs text-slate-400 italic text-center py-1">
                        ⚡ Progress diperbarui otomatis oleh sistem.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
