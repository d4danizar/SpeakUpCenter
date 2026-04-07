import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgramDetailClient from "./ProgramDetailClient";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const resolvedParams = await params;
  const program = await prisma.programClass.findUnique({
    where: { id: resolvedParams.programId },
    include: {
      schedules: {
        include: {
          _count: {
            select: { enrollments: true }
          }
        }
      }
    }
  });

  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  if (!program) return notFound();

  return <ProgramDetailClient program={program} tutors={tutors} />;
}
