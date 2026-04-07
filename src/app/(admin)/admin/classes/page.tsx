import { getProgramClasses } from "@/lib/actions/academic-actions";
import AdminClassesClient from "./AdminClassesClient";

export const dynamic = "force-dynamic";

export default async function AcademicMasterDataPage() {
  const result = await getProgramClasses();
  const programs = result.data || [];

  const desiredOrder = [
    "Kiddos - Kids A (1-3 SD)",
    "Kiddos - Kids B (4-6 SD)",
    "Kiddos - Teens A (SMP)",
    "Kiddos - Teens B (SMA-Kuliah)",
    "Adult Speak (Mahasiswa-Pekerja)",
    "Private - Custom",
    "Private - Adult Executive (2 Sesi)",
  ];

  programs.sort((a, b) => {
    const indexA = desiredOrder.findIndex(d => a.name.includes(d) || d.includes(a.name));
    const indexB = desiredOrder.findIndex(d => b.name.includes(d) || d.includes(b.name));
    const orderA = indexA !== -1 ? indexA : 99;
    const orderB = indexB !== -1 ? indexB : 99;
    return orderA - orderB;
  });

  return <AdminClassesClient initialPrograms={programs} />;
}
