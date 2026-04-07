"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { changePassword } from "@/lib/actions/user-actions";

export function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = oldPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPassword.length < 6) {
      setResult({ success: false, message: "Password baru minimal 6 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: "Konfirmasi password tidak cocok." });
      return;
    }

    startTransition(async () => {
      const res = await changePassword(oldPassword, newPassword);
      setResult(res);
      if (res.success) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  const inputClass =
    "w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 font-medium text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 tracking-tight leading-none text-base">
            Ganti Password
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Masukkan password lama untuk verifikasi, lalu buat password baru
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        {/* Password Lama */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Password Lama
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className={inputClass}
              required
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-slate-200" />

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
              className={inputClass}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-amber-500 font-medium">⚠ Terlalu pendek — minimal 6 karakter</p>
          )}
        </div>

        {/* Konfirmasi Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className={inputClass}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 font-medium">✕ Password tidak cocok</p>
          )}
          {confirmPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword && (
            <p className="text-xs text-emerald-500 font-medium">✓ Password cocok</p>
          )}
        </div>

        {/* Result notification */}
        {result && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${
              result.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {result.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !isValid}
          className="mt-1 flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all text-sm tracking-wide shadow-sm cursor-pointer disabled:cursor-not-allowed"
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
