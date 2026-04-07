import { prisma } from "../../../../lib/prisma";
import { UsersClientView } from "./UsersClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const branchFilter = await getBranchFilter();

  // Fetch all users with all student-specific fields
  const rawUsers = await prisma.user.findMany({
    where: { ...branchFilter },
    orderBy: { createdAt: "desc" },
  });

  const users = rawUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    branch: user.branch,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    activeProgram: (user as any).activeProgram || "-",
    programBatch: (user as any).programBatch || null,
    startDate: (user as any).startDate ? new Date((user as any).startDate).toISOString() : null,
    endDate: (user as any).endDate ? new Date((user as any).endDate).toISOString() : null,
    durationOption: (user as any).durationOption || null,
    batchSchedule: (user as any).batchSchedule || null,
  }));

  const programs = await prisma.programClass.findMany({ 
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' }
  });

  return <UsersClientView initialUsers={users} activeBranch={branchFilter.branch} programs={programs} />;
}
