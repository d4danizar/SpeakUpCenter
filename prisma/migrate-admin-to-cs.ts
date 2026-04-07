/**
 * One-time migration script:
 * Converts all existing users with role ADMIN -> CS
 * so that Prisma db push can safely remove the ADMIN enum variant.
 *
 * Run with: npx tsx prisma/migrate-admin-to-cs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Use raw SQL because the ADMIN enum value is still valid at this point
  const result = await prisma.$executeRaw`
    UPDATE "public"."User"
    SET "role" = 'CS'::"public"."Role"
    WHERE "role" = 'ADMIN'::"public"."Role"
  `;
  console.log(`✅ Updated ${result} user(s) from ADMIN -> CS`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
