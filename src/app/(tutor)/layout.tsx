import Link from "next/link";
import { SignOutButton } from "../../components/auth/SignOutButton";

import { TutorSidebar } from "./TutorSidebar";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      <TutorSidebar />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
