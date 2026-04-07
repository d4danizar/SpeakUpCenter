"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "../../components/auth/SignOutButton";

const navItems = [
  { label: "Daily Schedule", href: "/tutor/dashboard", emoji: "📋" },
  { label: "Evaluations", href: "/tutor/evaluations", emoji: "📝" },
  { label: "Pengaturan", href: "/tutor/settings", emoji: "⚙️" },
];

export function TutorSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 justify-center">
          <img src="/logo-icon.png" alt="SpeakUp Center Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col justify-center">
            <h1 className="text-white font-extrabold text-base tracking-wider leading-tight m-0">
              SPEAKUP
              <span className="block text-blue-400 font-medium text-[10px] tracking-widest mt-0.5">
                CENTER
              </span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 min-w-[256px] bg-slate-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:overflow-y-auto md:translate-x-0 border-r border-slate-800 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex justify-between items-center h-24 px-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 justify-center">
            <img src="/logo-icon.png" alt="SpeakUp Center Logo" className="w-8 h-8 object-contain" />
            <div className="flex flex-col justify-center">
              <h1 className="text-white font-extrabold text-lg tracking-wider leading-tight m-0">
                SPEAKUP
                <span className="block text-blue-400 font-medium text-sm tracking-widest mt-0.5">
                  CENTER
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 mt-2 tracking-widest uppercase">
                Tutor Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 bg-slate-900">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group no-underline ${
                  isActive
                    ? "bg-slate-800 text-white border-l-4 border-blue-500 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform block">
                  {item.emoji}
                </span>
                <span className="block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out — pinned bottom */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950 flex flex-col gap-3">
          <SignOutButton className="flex items-center gap-2 px-4 py-2.5 w-full text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-all justify-center border border-white/5 hover:border-rose-500/20" />
          
          <div className="pt-3 mt-1 border-t border-slate-800 text-center">
             <p className="text-[10px] text-slate-500 font-medium tracking-wide">
               Powered by <span className="font-bold text-slate-400">dspaceweb</span>
             </p>
          </div>
        </div>
      </aside>
    </>
  );
}
