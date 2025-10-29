import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating all users to have AUD currency and dd/MM/yy date format...')

  const result = await prisma.user.updateMany({
    data: {
      currency: 'AUD',
      dateFormat: 'dd/MM/yy',
      locale: 'en-AU',
    },
  })

  console.log(`✅ Updated ${result.count} user(s)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
