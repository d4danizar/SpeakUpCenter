"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        window.location.href = "/login";
      }}
      className={
        className ||
        "flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-all"
      }
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
