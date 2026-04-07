"use server";

import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, BranchLocation } from "@prisma/client";

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const role = formData.get("role") as Role;
    const password = formData.get("password") as string;

    if (!name || !email || !password || !role) {
      return { error: "Name, email, password, and role are required." };
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber: phoneNumber || null,
        role,
        passwordHash,
      },
    });

    // Refresh the table UI automatically
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists in the system." };
    }
    return { error: error.message || "Failed to create user." };
  }
}

export async function editUser(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const role = formData.get("role") as Role;
    const programId = formData.get("programId") as string;

    if (!id || !name || !email || !role) {
      return { error: "ID, Name, email, and role are required." };
    }

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phoneNumber: phoneNumber || null,
        role,
      },
    });

    if (programId && role === 'STUDENT') {
      const schedule = await prisma.classSchedule.findFirst({
        where: { programId }
      });
      
      if (schedule) {
        const existing = await prisma.enrollment.findFirst({
          where: { studentId: id }
        });
        
        if (existing) {
          await prisma.enrollment.update({
            where: { id: existing.id },
            data: { scheduleId: schedule.id }
          });
        } else {
          await prisma.enrollment.create({
            data: {
              studentId: id,
              scheduleId: schedule.id,
              startDate: new Date(),
              frozenPrice: 0 // Mock baseline for now
            }
          });
        }
      }
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists in the system." };
    }
    return { error: error.message || "Failed to edit user." };
  }
}

export async function resetPassword(userId: string) {
  try {
    const passwordHash = await bcrypt.hash("kampunginggris123", 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reset password." };
  }
}

export async function updateStudentStatus(id: string, newStatus: string) {
  try {
    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update status." };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Cascade delete: attendance records for this student
    await prisma.attendance.deleteMany({ where: { studentId: userId } });
    // Delete sessions taught by this tutor (will cascade delete their attendances too)
    await prisma.session.deleteMany({ where: { tutorId: userId } });
    
    await prisma.user.delete({ where: { id: userId } });
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete user. Please check related records." };
  }
}

export async function createStudentEnrollment({ 
  studentId, 
  programId, 
  scheduleId 
}: { 
  studentId: string; 
  programId: string; 
  scheduleId: string; 
}) {
  // TODO: Logika Enrollment Siswa
  // Karena pendaftaran siswa melewati alur CRM 
  // (Lead -> Negosiasi -> Invoice Lunas), fungsi ini akan dipanggil setelahnya.
  console.log("Mock Enrollment created for:", { studentId, programId, scheduleId });
  return { success: true };
}
