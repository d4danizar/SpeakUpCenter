/**
 * Migration script: Tambah Pertemuan 4 (Perform di Mall) ke semua modul di kelas Kids A & Kids B
 * Run: npx tsx prisma/add-meeting4-kids.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ log: ["query"] });

const KIDS_CLASS_IDS = [
  "cmow9f8jq00003r7xg83xgour", // Kids A
  "cmow9fi3s00013r7x8ex7c870", // Kids B
];

// Rubric placeholder (A-E kosong) untuk Pertemuan 4
const defaultRubricData = [
  {
    aspectName: "Keberanian Tampil",
    A: { desc: "-", saran: "-" },
    B: { desc: "-", saran: "-" },
    C: { desc: "-", saran: "-" },
    D: { desc: "-", saran: "-" },
    E: { desc: "-", saran: "-" },
  },
  {
    aspectName: "Kepercayaan Diri",
    A: { desc: "-", saran: "-" },
    B: { desc: "-", saran: "-" },
    C: { desc: "-", saran: "-" },
    D: { desc: "-", saran: "-" },
    E: { desc: "-", saran: "-" },
  },
];

async function main() {
  let totalAdded = 0;

  for (const classId of KIDS_CLASS_IDS) {
    const programClass = await prisma.programClass.findUnique({
      where: { id: classId },
      include: {
        modules: {
          include: { meetings: { select: { meetingNumber: true } } },
          orderBy: { moduleNumber: "asc" },
        },
      },
    });

    if (!programClass) {
      console.log(`⚠️  Class ID ${classId} tidak ditemukan, skip.`);
      continue;
    }

    console.log(`\n📚 Processing: ${programClass.name}`);

    for (const mod of programClass.modules) {
      const hasM4 = mod.meetings.some((m) => m.meetingNumber === 4);
      if (hasM4) {
        console.log(`  ✅ Modul ${mod.moduleNumber} "${mod.title}" sudah punya Pertemuan 4, skip.`);
        continue;
      }

      // Determine material based on module (last module = competition, others = Perform di Mall)
      const material =
        mod.moduleNumber === 6 ? "PUBLIC SPEAKING COMPETITION" : "Perform di Mall";

      await prisma.moduleMeeting.create({
        data: {
          meetingNumber: 4,
          material,
          isPerformance: false,
          rubricData: defaultRubricData as any,
          moduleId: mod.id,
        },
      });

      console.log(`  ➕ Modul ${mod.moduleNumber} "${mod.title}" → Pertemuan 4 ditambahkan! (${material})`);
      totalAdded++;
    }
  }

  console.log(`\n✨ Selesai! Total ${totalAdded} Pertemuan 4 berhasil ditambahkan.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
