import { SignOutButton } from "../../components/auth/SignOutButton";
import { LayoutDashboard, CalendarDays, Star } from "lucide-react";
import Image from "next/image";
import { COMPANY_INFO } from "@/lib/constants/branding";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 pb-20 md:pb-0">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm relative z-50 sticky top-0">
        <nav className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Image 
              src={COMPANY_INFO.logoSmallUrl} 
              alt="SpeakUp Center Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
            <h1 className="text-slate-900 font-extrabold text-sm sm:text-base tracking-wider leading-tight hidden sm:block">
              SPEAKUP
              <span className="block text-indigo-600 font-medium text-[10px] tracking-widest mt-0.5">
                CENTER
              </span>
            </h1>
          </div>
          
          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="/student/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</a>
            <a href="/student/schedules" className="hover:text-slate-900 transition-colors">My Schedule</a>
            <a href="/student/evaluations" className="hover:text-slate-900 transition-colors">Evaluations</a>
            <a href="/student/settings" className="hover:text-slate-900 transition-colors">Settings</a>
            <div className="pl-4 border-l border-slate-200">
              <SignOutButton className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all" />
            </div>
          </div>

          {/* MOBILE LOGOUT BUTTON */}
          <div className="md:hidden">
            <SignOutButton className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg transition-all" />
          </div>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        
        {/* Footer Credit */}
        <footer className="mt-8 py-6 text-center border-t border-slate-200">
           <p className="text-xs text-slate-500 font-medium tracking-wide">
             Powered by <span className="font-bold text-slate-400">dspaceweb</span>
           </p>
        </footer>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center px-2 py-3">
        <a href="/student/dashboard" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <LayoutDashboard className="w-5 h-5 text-slate-900" />
          <span className="text-[10px] font-bold text-slate-900">Home</span>
        </a>
        <a href="/student/schedules" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Schedule</span>
        </a>
        <a href="/student/evaluations" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Scores</span>
        </a>
        <a href="/student/settings" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Settings</span>
        </a>
      </nav>
    </div>
  );
}
