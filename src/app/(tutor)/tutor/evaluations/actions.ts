"use server";

import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProgramsForFilter() {
  return prisma.programClass.findMany({
    select: {
      id: true,
      name: true,
      category: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getStudentsByProgram(programId: string) {
  // Find all enrollments belonging to the given program based on the schedule relation
  const enrollments = await prisma.enrollment.findMany({
    where: {
      schedule: {
        programId: programId,
      },
      student: {
        role: "STUDENT",
        status: "ACTIVE"
      }
    },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          evaluationsReceived: {
            where: {
              programId: programId
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
      }
    }
  });

  // Extract unique students from the enrollments
  const studentMap = new Map();
  for (const e of enrollments) {
    if (!studentMap.has(e.student.id)) {
      studentMap.set(e.student.id, e.student);
    }
  }

  return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function submitAdHocEvaluation(
  programId: string,
  studentId: string,
  tutorId: string,
  moduleName: string,
  sessionType: string,
  notes: string,
  metricsStr: string // JSON representation of { metricName: "A", ... }
) {
  try {
    const metrics = JSON.parse(metricsStr);

    await prisma.evaluation.create({
      data: {
        programId,
        studentId,
        tutorId,
        moduleName,
        sessionType,
        metrics,
        notes: notes || null,
      }
    });

    revalidatePath("/tutor/evaluations");
    return { success: true };
  } catch (error: any) {
    console.error("submitAdHocEvaluation error:", error);
    return { error: error.message || "Failed to submit evaluation." };
  }
}
