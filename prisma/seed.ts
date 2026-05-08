// prisma/seed.ts
// Jalankan: npx ts-node prisma/seed.ts
// ATAU: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding users...");

  const accounts = [
    { name: "Super Admin", email: "admin@speakup.com", password: "admin123", role: "SUPER_ADMIN" as const },
    { name: "Manager", email: "manager@speakup.com", password: "admin123", role: "MANAGER" as const },
    { name: "CS Team", email: "cs@speakup.com", password: "admin123", role: "CS" as const },
    { name: "Tutor Demo", email: "tutor@speakup.com", password: "tutor123", role: "TUTOR" as const },
    { name: "Murid Demo", email: "murid@speakup.com", password: "murid123", role: "STUDENT" as const },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: { passwordHash: hash, name: acc.name, role: acc.role },
      create: {
        name: acc.name,
        email: acc.email,
        passwordHash: hash,
        role: acc.role,
        branch: "CENTER_POINT",
        status: "ACTIVE",
      },
    });
    console.log(`  ✅ ${user.role}: ${user.email} (pw: ${acc.password})`);
  }

  console.log("\n✨ Seed selesai!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
