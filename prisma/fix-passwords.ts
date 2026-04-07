import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('kampunginggris123', 10)

  // Update ALL users whose passwordHash is not a valid bcrypt hash
  const allUsers = await prisma.user.findMany()
  let updated = 0

  for (const user of allUsers) {
    // bcrypt hashes always start with "$2a$" or "$2b$"
    if (!user.passwordHash.startsWith('$2')) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      })
      console.log(`✅ Updated: ${user.email} (${user.role})`)
      updated++
    } else {
      console.log(`⏭️  Skipped: ${user.email} (already hashed)`)
    }
  }

  console.log(`\nDone! Updated ${updated} of ${allUsers.length} users.`)
  console.log('Default password: kampunginggris123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
