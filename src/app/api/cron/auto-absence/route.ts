import { NextResponse } from "next/server";
import { runDailyAutoAbsence } from "@/lib/actions/attendance-actions";

export async function GET(req: Request) {
  // Verifikasi Autentikasi (Bisa menggunakan skema token header Bearer untuk Vercel Cron)
  // const authHeader = req.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return NextResponse.json({error: "Unauthorized"}, {status: 401}) }

  try {
    const result = await runDailyAutoAbsence();
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
