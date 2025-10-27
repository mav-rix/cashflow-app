import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  const email = 'user@example.com'
  const password = 'password123'
  const name = 'Demo User'
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })
  
  if (existingUser) {
    console.log(`✅ User ${email} already exists with ID: ${existingUser.id}`)
    return
  }
  
  // Create new user
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      currency: 'AUD',
      dateFormat: 'dd/MM/yyyy',
      locale: 'en-AU',
      statsPeriod: 'monthly',
    },
  })
  
  console.log(`✅ User created successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   User ID: ${user.id}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
