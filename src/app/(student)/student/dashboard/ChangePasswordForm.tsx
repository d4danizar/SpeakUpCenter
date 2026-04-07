"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateUserPassword } from "@/lib/actions/user-actions";

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPassword.length < 6) {
      setResult({ success: false, message: "Password minimal 6 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: "Konfirmasi password tidak cocok." });
      return;
    }

    startTransition(async () => {
      const res = await updateUserPassword(userId, newPassword);
      setResult(res);
      if (res.success) {
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 tracking-tight leading-none">Keamanan Akun</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Perbarui password login Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Password Baru */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-red-500 font-medium">Terlalu pendek</p>
          )}
        </div>

        {/* Konfirmasi Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 font-medium">Password tidak cocok</p>
          )}
        </div>

        {/* Notifikasi */}
        {result && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {result.success
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {result.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || newPassword.length < 6 || newPassword !== confirmPassword}
          className="mt-2 flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all text-sm tracking-wide shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memperbarui...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Simpan Password Baru
            </>
          )}
        </button>
      </form>
    </div>
  );
}
