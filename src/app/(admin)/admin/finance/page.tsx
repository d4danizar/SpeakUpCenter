import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { FinanceClientView } from "./FinanceClientView";

export const metadata = { title: "Finance Dashboard" };

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Only SUPER_ADMIN, MANAGER, CS
  const ALLOWED = ["SUPER_ADMIN", "MANAGER", "CS"];
  if (!ALLOWED.includes(session.user.role as string)) {
    redirect("/admin/dashboard");
  }

  return <FinanceClientView />;
}
