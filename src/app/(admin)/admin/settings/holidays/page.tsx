import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getHolidays } from "./actions";
import HolidaysClient from "./HolidaysClient";

export const dynamic = "force-dynamic";

export default async function HolidaysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const holidays = await getHolidays();

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-red-500" />
          Kalender Libur Nasional
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola tanggal merah agar sistem dapat menandai sesi yang dibatalkan otomatis.
        </p>
      </div>

      <HolidaysClient initial={holidays} />
    </div>
  );
}
