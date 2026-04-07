"use server";

import { cookies } from "next/headers";
import { BranchLocation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BRANCH_COOKIE = "active-branch";
const VALID_BRANCHES = Object.values(BranchLocation);

export async function setActiveBranch(branch: string) {
  // Lobotomi cabang: tidak melakukan apa-apa
}

export async function getActiveBranch(): Promise<BranchLocation> {
  return "CENTER_POINT" as BranchLocation;
}

export async function getBranchFilter(): Promise<{ branch: BranchLocation }> {
  return { branch: "CENTER_POINT" as BranchLocation };
}
