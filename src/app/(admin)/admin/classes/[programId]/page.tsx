import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgramDetailClient from "./ProgramDetailClient";
import CurriculumManager from "./CurriculumManager";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const resolvedParams = await params;
  const pid = resolvedParams.programId;

  const program = await prisma.programClass.findUnique({
    where: { id: pid },
    include: {
      schedules: {
        include: {
          _count: { select: { preferredByEnrollments: true } }
        }
      },
      // Global Pool murid di program ini
      enrollments: {
        include: {
          student: {
            select: { id: true, name: true, email: true, phoneNumber: true, studentStatus: true }
          },
          preferredSchedule: {
            select: { id: true, title: true, dayOfWeek: true, startTime: true, endTime: true }
          }
        },
        orderBy: { startDate: "desc" }
      }
    }
  });

  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  // Kurikulum Rotasi (6 Modul × 4 Pertemuan) — satu-satunya source of truth
  const curriculumModules = await (prisma as any).programModule.findMany({
    where: { programId: pid },
    include: {
      meetings: { orderBy: { meetingNumber: "asc" } }
    },
    orderBy: { moduleNumber: "asc" },
  });

  if (!program) return notFound();

  return (
    <div>
      <ProgramDetailClient
        program={program}
        tutors={tutors}
        enrolledStudents={program.enrollments}
      />
      <div className="px-6 pb-10 max-w-5xl mx-auto w-full">
        <CurriculumManager programId={program.id} initialModules={curriculumModules} />
      </div>
    </div>
  );
}


