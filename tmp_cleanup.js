const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const newProgram = await prisma.programClass.findFirst({
    where: { name: 'Adult Speak' }
  });
  
  if (!newProgram) {
    console.log("Program baru belum tersedia");
    return;
  }

  const oldPrograms = await prisma.programClass.findMany({
    where: {
      name: {
        notIn: [
          'Kiddos Kids A',
          'Kiddos Kids B',
          'Kiddos Teens A',
          'Kiddos Teens B',
          'Adult Speak',
          'Private Kids',
          'Private Adults'
        ]
      }
    }
  });

  const oldIds = oldPrograms.map(p => p.id);
  
  if (oldIds.length > 0) {
    console.log(`Mengalihkan relasi data untuk ${oldIds.length} program usang...`);
    // Migrate Invoices to new program to prevent foreign key errors
    await prisma.invoice.updateMany({
      where: { programId: { in: oldIds } },
      data: { programId: newProgram.id }
    });
    
    // Clean up dependent schedules and evaluations
    await prisma.classSchedule.deleteMany({
      where: { programId: { in: oldIds } },
    });
    await prisma.evaluation.deleteMany({
      where: { programId: { in: oldIds } },
    });

    // Delete the old programs
    const deleted = await prisma.programClass.deleteMany({
      where: { id: { in: oldIds } },
    });
    
    console.log(`Sukses menghapus ${deleted.count} program lama! Sekarang tabel ProgramClass sepenuhnya murni.`);
  } else {
    console.log("Tidak ada program lama yang perlu dihapus.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
