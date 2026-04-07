import { prisma } from "../../../../lib/prisma";
import { PayrollClientView } from "./PayrollClientView";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export default async function AdminPayrollPage() {
  await getServerSession(authOptions); // Ensure access

  // --- PRISMA QUERY LOGIC FOR FLAT RATE PAYROLL ---
  // 1. Get start and end of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const branchFilter = await getBranchFilter();

  // 2. Query: Get all tutors with their completed sessions this month
  // Open Pool model: Sessions are directly linked to tutors via `sessionsTaught`
  const rawTutors = await prisma.user.findMany({
    where: { role: "TUTOR", ...branchFilter },
    include: {
      sessionsTaught: {
        where: {
          isCompleted: true,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }
    }
  });

  // 3. Calculate FLAT RATE payroll
  const PAY_PER_SESSION = 30000;

  const payrollData = rawTutors.map(tutor => {
    const totalSessions = tutor.sessionsTaught.length;
    const totalPay = totalSessions * PAY_PER_SESSION;
    
    const status = totalSessions === 0 ? "No Pay" : "Pending";

    return {
      id: tutor.id,
      name: tutor.name,
      totalSessions,
      totalPay,
      status
    };
  });

  // Sort descending by highest pay
  payrollData.sort((a, b) => b.totalPay - a.totalPay);

  return <PayrollClientView payrollData={payrollData} />;
}
