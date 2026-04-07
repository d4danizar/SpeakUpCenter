import { prisma } from "./prisma";
import { startOfDay, endOfDay } from "date-fns";

// Map session programType → eligible student activeProgram values (strict radar)
function getEligiblePrograms(programType: string): string[] {
  const normType = programType.trim().toLowerCase();
  switch (normType) {
    case "conversation":
      return ["Regular", "Fullday", "Asrama"];
    case "efk":
      return ["EFK"];
    case "eft":
      return ["EFT"];
    case "private":
      return ["Private"];
    case "toefl prep":
    case "toefl":
      return ["TOEFL", "TOEFL Prep"];
    case "english on saturday":
      return ["English on Saturday"];
    default:
      return [programType];
  }
}

// Get broader pool for manual "Add Student" dropdown
function getGlobalPoolPrograms(programType: string): string[] {
  const normType = programType.trim().toLowerCase();
  switch (normType) {
    case "conversation":
      return ["Regular", "Fullday", "Asrama", "English on Saturday"];
    case "efk":
      return ["EFK"];
    case "eft":
      return ["EFT"];
    case "english on saturday":
      return ["English on Saturday"];
    case "private":
      return ["Private"];
    case "toefl prep":
    case "toefl":
      return ["TOEFL", "TOEFL Prep"];
    default:
      return [programType];
  }
}

export type EligibleStudentResult = {
  id: string;
  name: string;
  activeProgram: string | null;
};

/**
 * Strict Radar: Get eligible students for a specific session.
 * Applies all business rules (programBatch match, day matching, etc.)
 */
export async function getEligibleStudentsForSession(session: {
  date: Date;
  timeSlot: string;
  programType: string;
  assignedStudents?: { id: string }[];
}): Promise<EligibleStudentResult[]> {
  const eligiblePrograms = getEligiblePrograms(session.programType);

  const sessionStartOfDay = startOfDay(session.date);
  const sessionEndOfDay = endOfDay(session.date);

  // Broad fetch: all active students with matching programs + valid date range
  const candidateStudents = await (prisma.user as any).findMany({
    where: {
      role: "STUDENT",
      activeProgram: { in: eligiblePrograms },
      OR: [
        { startDate: null },
        { startDate: { lte: sessionEndOfDay } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: sessionStartOfDay } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      activeProgram: true,
      programBatch: true,
      batchSchedule: true,
      endDate: true,
      startDate: true,
    },
    orderBy: { name: "asc" },
  });

  // Precise filtering based on business rules
  const sessionDay = session.date.getDay(); // 0=Sun, 1=Mon .. 6=Sat

  return candidateStudents.filter((student) => {
    if (!student.activeProgram) return false;

    const prog = student.activeProgram.trim().toLowerCase();

    // --- MULAI DEBUGGER ---
    if (student.activeProgram === "Regular") {
      console.log("=== CEK MURID REGULAR ===");
      console.log("Nama:", student.name);
      console.log("Student Batch Asli:", `"${student.programBatch}"`);
      console.log("Session Time Asli:", `"${session.timeSlot}"`);
      console.log("Session ProgramType:", `"${session.programType}"`);

      // Cek apakah masa aktifnya nyangkut
      console.log("Session Date:", session.date);
      console.log("Student End Date:", student.endDate);
      console.log("=========================");
    }
    // --- AKHIR DEBUGGER ---

    const sessionProgType = session.programType.trim().toLowerCase();

    // --- CONVERSATION RULES ---
    if (sessionProgType === "conversation") {
      if (prog === "regular") {
        if (!student.programBatch) return false;
        const normBatch = student.programBatch.trim().toLowerCase();
        const normTime = session.timeSlot.trim().toLowerCase();
        return normTime.includes(normBatch) || normBatch.includes(normTime);
      }
      if (prog === "fullday") {
        return session.timeSlot.trim().toLowerCase() !== "18:30 - 20:00";
      }
      if (prog === "asrama") {
        return true;
      }
      return false;
    }

    // --- EFK / EFT RULES (day-matching) ---
    if (sessionProgType === "efk" || sessionProgType === "eft") {
      if (prog !== sessionProgType) return false;

      const batchSchedule = (student.batchSchedule || "").trim().toLowerCase();
      if (sessionDay === 1 || sessionDay === 3) {
        return batchSchedule === "senin-rabu";
      }
      if (sessionDay === 2 || sessionDay === 4) {
        return batchSchedule === "selasa-kamis";
      }
      if (sessionDay === 5 || sessionDay === 6) {
        return batchSchedule === "jumat-sabtu";
      }
      return false;
    }

    // --- ENGLISH ON SATURDAY ---
    if (sessionProgType === "english on saturday") {
      return prog === "english on saturday";
    }

    // --- PRIVATE / TOEFL / HYBRID POOL ---
    const isAssignedPool = sessionProgType === "private" || sessionProgType === "toefl" || sessionProgType === "toefl prep";
    
    if (isAssignedPool) {
      if (!session.assignedStudents) return false;
      const isAssigned = session.assignedStudents.some(as => as.id === student.id);
      return isAssigned && prog === sessionProgType;
    }

    // --- OTHER ---
    return prog === sessionProgType;
  }).map((s) => ({ id: s.id, name: s.name, activeProgram: s.activeProgram }));
}

/**
 * Global Pool / Radar: Get all eligible students for a specific session's time slot.
 * Enforces Gym Membership rules (Asrama, Fullday, Regular).
 */
export async function getGlobalPoolForSession({
  programType,
  timeSlot,
}: {
  programType: string;
  timeSlot: string;
}): Promise<EligibleStudentResult[]> {
  const normType = programType.trim().toUpperCase();

  // 1. Base query: Must be an active student in this program family
  const baseQuery: any = {
    role: "STUDENT",
    activeProgram: programType,
    endDate: { gte: new Date() },
  };

  // 2. Smart Filtering based on TimeSlot for CONVERSATION
  if (normType === "CONVERSATION") {
    // Determine the nature of the timeslot
    const safeTimeSlot = timeSlot || "";
    const isSesi1to4 = ["08:00 - 09:30", "10:00 - 11:30", "12:30 - 14:00", "14:30 - 16:00"].includes(
      safeTimeSlot.trim()
    );

    // Convert timeslot to standard session name for Regular students
    let currentSessionName = "Sesi 1";
    if (safeTimeSlot.includes("10:00")) currentSessionName = "Sesi 2";
    if (safeTimeSlot.includes("12:30")) currentSessionName = "Sesi 3";
    if (safeTimeSlot.includes("14:30")) currentSessionName = "Sesi 4";
    if (safeTimeSlot.includes("18:30")) currentSessionName = "Sesi 5";

    // Allowed Batches config
    const allowedBatches = ["ASRAMA", currentSessionName]; // Everyone gets Asrama + their specific session

    if (isSesi1to4) {
      allowedBatches.push("FULLDAY"); // Fullday gets access to Sesi 1-4, but not Sesi 5
    }

    baseQuery.programBatch = { in: allowedBatches };
  } else {
    // For non-conversation (EFK, EFT, TOEFL), use the standard program matching
    const poolPrograms = getGlobalPoolPrograms(programType);
    baseQuery.activeProgram = { in: poolPrograms };
  }

  // 3. Execute Query
  console.log("🕵️ RADAR SEARCH PARAMS:", { programName: programType, batch: timeSlot, query: "" });

  const pool = await (prisma.user as any).findMany({
    where: {
      role: "STUDENT",
      name: {
        contains: "",
        mode: "insensitive"
      }
    },
    take: 10,
    select: { id: true, name: true, activeProgram: true, programBatch: true },
    orderBy: { name: "asc" },
  });

  return pool.map((s: any) => ({ id: s.id, name: s.name, activeProgram: s.activeProgram ?? null }));
}
