const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting comprehensive DB seeding ---');

  // A. MASTER PROGRAMS
  const defaultPrograms = [
    { name: 'Kiddos Kids A', description: 'Program Public Speaking untuk Kelas 1-3 SD' },
    { name: 'Kiddos Kids B', description: 'Program Public Speaking untuk Kelas 4-6 SD' },
    { name: 'Kiddos Teens A', description: 'Program Public Speaking untuk SMP' },
    { name: 'Kiddos Teens B', description: 'Program Public Speaking untuk SMA dan Kuliah' },
    { name: 'Adult Speak', description: 'Program Public Speaking Reguler untuk Dewasa' },
    { name: 'Private Kids', description: 'Program Public Speaking Privat Eksklusif untuk Anak' },
    { name: 'Private Adults', description: 'Program Public Speaking Privat Eksklusif untuk Dewasa' }
  ];

  for (const prog of defaultPrograms) {
    const existing = await prisma.programClass.findFirst({
      where: { name: prog.name }
    });
    
    if (!existing) {
      await prisma.programClass.create({
        data: {
          name: prog.name,
          basePrice: 1800000, // Harga default basis
          // description di-skip sementara karena schema saat ini belum mewarisi field description
        }
      });
    }
  }
  console.log(`Upserted ${defaultPrograms.length} Master Programs successfully.`);

  // B. USERS (ADMIN, TUTOR, STUDENT)
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. ADMIN (Role SUPER_ADMIN menyesuaikan Schema yang valid)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@speakup.com' },
    update: {},
    create: {
      email: 'admin@speakup.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      branch: 'CENTER_POINT',
      passwordHash,
      status: 'ACTIVE',
    } as any, // 'as any' mengamankan field status yang belum tersinkron di IDE type checking 
  });
  console.log(`Upserted/Created Admin: ${admin.name} (${admin.email})`);

  // 2. TUTOR
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@speakup.com' },
    update: {},
    create: {
      email: 'tutor@speakup.com',
      name: 'Tutor Teladan',
      role: 'TUTOR',
      branch: 'CENTER_POINT',
      passwordHash,
      status: 'ACTIVE',
    } as any,
  });
  console.log(`Upserted/Created Tutor: ${tutor.name} (${tutor.email})`);

  // 3. STUDENT
  const student = await prisma.user.upsert({
    where: { email: 'student@speakup.com' },
    update: {},
    create: {
      email: 'student@speakup.com',
      name: 'Murid Teladan',
      role: 'STUDENT',
      branch: 'CENTER_POINT',
      passwordHash,
      status: 'ACTIVE',
    } as any,
  });
  console.log(`Upserted/Created Student: ${student.name} (${student.email})`);

  console.log('--- Seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
