import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/ui/ChangePasswordForm";

export default async function StudentSettingsPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
            Pengaturan Akun
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 tracking-wide">
            Kelola kata sandi dan keamanan akun Anda di sini.
          </p>
        </div>
        
        <ChangePasswordForm />
      </div>
    </div>
  );
}
