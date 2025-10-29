import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get the user
  const user = await prisma.user.findFirst()
  
  if (!user) {
    console.error('❌ No user found. Please create a user first.')
    return
  }

  console.log('👤 User found:', user.email)

  // Get account
  const account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (!account) {
    console.error('❌ No account found.')
    return
  }

  console.log('📊 Using account:', account.name)

  // Get Salary category
  const salaryCategory = await prisma.category.findFirst({
    where: { 
      userId: user.id,
      name: 'Salary',
      type: 'income'
    }
  })

  if (!salaryCategory) {
    console.error('❌ No Salary category found.')
    return
  }

  console.log('📋 Found Salary category')

  // Create income with bonus
  const income = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: salaryCategory.id,
      amount: 1563.65, // Base salary
      type: 'income',
      description: 'Super Retail Group',
      date: new Date(),
      isRecurring: true,
      recurrence: 'biweekly',
      bonusAmount: 272.00, // On-call bonus
      includeBonusNext: false, // You can toggle this on the transactions page
    }
  })

  // Update account balance (only base amount, bonus is optional)
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { increment: 1563.65 } }
  })

  console.log('✅ Income added: Super Retail Group')
  console.log(`   Base: $${income.amount}`)
  console.log(`   Bonus: $${income.bonusAmount} (toggle on/off as needed)`)
  console.log(`   Total when bonus included: $${income.amount + (income.bonusAmount || 0)}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
