"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setActiveBranch } from "@/lib/actions/branch-actions";
import { BranchLocation } from "@prisma/client";
import { Building2, ChevronDown, Check, Loader2, MapPin } from "lucide-react";

const BRANCH_LABELS: Record<BranchLocation, string> = {
  CENTER_POINT: "Center Point",
};

const BRANCH_OPTIONS = Object.entries(BRANCH_LABELS) as [BranchLocation, string][];

export function BranchSwitcher({
  initialBranch,
}: {
  initialBranch: BranchLocation;
}) {
  const router = useRouter();
  const [activeBranch, setLocalBranch] = useState<BranchLocation>(initialBranch);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (branch: BranchLocation) => {
    if (branch === activeBranch) {
      setIsOpen(false);
      return;
    }
    setLocalBranch(branch);
    setIsOpen(false);
    startTransition(async () => {
      await setActiveBranch(branch);
      router.refresh();
    });
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
          text-left cursor-pointer select-none
          transition-all duration-200 ease-out
          border border-transparent
          ${isPending
            ? "bg-white/5 opacity-60 cursor-wait"
            : "bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/10"
          }
        `}
        aria-label="Pilih Cabang"
        aria-expanded={isOpen}
      >
        {/* Icon */}
        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 shrink-0">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          )}
        </span>

        {/* Label */}
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none mb-0.5">
            Cabang
          </span>
          <span className="block text-xs font-bold text-white truncate leading-tight">
            {BRANCH_LABELS[activeBranch]}
          </span>
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute left-0 right-0 mt-1.5 z-50
            bg-zinc-900 border border-zinc-700/60
            rounded-lg shadow-xl shadow-black/30
            overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-150
          `}
          role="listbox"
          aria-label="Daftar Cabang"
        >
          {BRANCH_OPTIONS.map(([value, label]) => {
            const isActive = value === activeBranch;
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(value)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5
                  text-left cursor-pointer select-none
                  transition-colors duration-150
                  ${isActive
                    ? "bg-blue-500/10 text-white"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }
                `}
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <span className="flex-1 text-xs font-semibold">{label}</span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// For non-SUPER_ADMIN/MANAGER — static read-only badge
export function BranchBadge({ branch }: { branch: BranchLocation }) {
  return (
    <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.04]">
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 shrink-0">
        <Building2 className="w-3.5 h-3.5 text-blue-400" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none mb-0.5">
          Cabang
        </span>
        <span className="block text-xs font-bold text-slate-300 truncate leading-tight">
          {BRANCH_LABELS[branch]}
        </span>
      </span>
    </div>
  );
}
