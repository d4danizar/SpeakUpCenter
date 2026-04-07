import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import { COMPANY_INFO } from "@/lib/constants/branding";

export const metadata = {
  title: "SpeakUp Center - ERP System",
  description: "Sistem Manajemen Internal Kelas Percaya Diri - SpeakUp Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gray-50 text-slate-900 flex flex-col min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
