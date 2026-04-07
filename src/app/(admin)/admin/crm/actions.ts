"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../../lib/prisma";
import { LeadStatus } from "@prisma/client";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export async function createLead(data: { name: string; whatsapp: string; notes?: string; assigneeId?: string }) {
  try {
    const branchFilter = await getBranchFilter();
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        whatsapp: data.whatsapp,
        notes: data.notes,
        assigneeId: data.assigneeId,
        branch: branchFilter.branch,
      },
    });
    
    revalidatePath("/admin/crm");
    return { success: true, lead };
  } catch (error) {
    console.error("Failed to create lead:", error);
    return { success: false, error: "Failed to create lead" };
  }
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
  try {
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });
    
    revalidatePath("/admin/crm");
    return { success: true, lead };
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return { success: false, error: "Failed to update lead status" };
  }
}

export async function deleteLead(leadId: string) {
  try {
    await prisma.lead.delete({
      where: { id: leadId },
    });
    
    revalidatePath("/admin/crm");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { success: false, error: "Failed to delete lead" };
  }
}

export async function getAllLeadsForExport() {
  try {
    const branchFilter = await getBranchFilter();
    const leads = await prisma.lead.findMany({
      where: { ...branchFilter },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        whatsapp: true,
        createdAt: true,
        status: true,
      }
    });
    return leads;
  } catch (error) {
    console.error("Failed to fetch leads for export:", error);
    return [];
  }
}
