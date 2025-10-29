import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth'

async function main() {
  console.log('🌱 Seeding test data...')

  // Create a test user
  const hashedPassword = await hashPassword('password123')
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@cashflow.com' },
    update: {},
    create: {
      email: 'demo@cashflow.com',
      name: 'Demo User',
      password: hashedPassword,
      currency: 'USD',
    },
  })

  console.log('✅ Created demo user: demo@cashflow.com (password: password123)')

  // Create test accounts
  const checkingAccount = await prisma.account.upsert({
    where: { id: 'checking-demo' },
    update: {},
    create: {
      id: 'checking-demo',
      name: 'Main Checking',
      type: 'checking',
      balance: 3250.75,
      currency: 'USD',
      description: 'Primary checking account',
      color: '#3b82f6',
      userId: user.id,
    },
  })

  const savingsAccount = await prisma.account.upsert({
    where: { id: 'savings-demo' },
    update: {},
    create: {
      id: 'savings-demo',
      name: 'Emergency Fund',
      type: 'savings',
      balance: 5000.00,
      currency: 'USD',
      description: 'Emergency savings',
      color: '#10b981',
      userId: user.id,
    },
  })

  const creditCard = await prisma.account.upsert({
    where: { id: 'credit-demo' },
    update: {},
    create: {
      id: 'credit-demo',
      name: 'Credit Card',
      type: 'credit_card',
      balance: -830.25,
      currency: 'USD',
      description: 'Main credit card',
      color: '#ef4444',
      userId: user.id,
    },
  })

  console.log('✅ Created 3 accounts')

  // Get categories
  const salaryCategory = await prisma.category.findFirst({
    where: { name: 'Salary', type: 'income' },
  })

  const foodCategory = await prisma.category.findFirst({
    where: { name: 'Food & Dining', type: 'expense' },
  })

  const transportCategory = await prisma.category.findFirst({
    where: { name: 'Transportation', type: 'expense' },
  })

  const shoppingCategory = await prisma.category.findFirst({
    where: { name: 'Shopping', type: 'expense' },
  })

  const billsCategory = await prisma.category.findFirst({
    where: { name: 'Bills & Utilities', type: 'expense' },
  })

  // Create transactions for current month
  const now = new Date()
  const transactions = [
    // Income
    {
      amount: 4500.00,
      type: 'income',
      description: 'Monthly Salary',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      accountId: checkingAccount.id,
      categoryId: salaryCategory?.id,
      userId: user.id,
    },
    {
      amount: 500.00,
      type: 'income',
      description: 'Freelance Project',
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      accountId: checkingAccount.id,
      categoryId: salaryCategory?.id,
      userId: user.id,
    },
    // Expenses
    {
      amount: 85.50,
      type: 'expense',
      description: 'Grocery Shopping',
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      accountId: checkingAccount.id,
      categoryId: foodCategory?.id,
      userId: user.id,
    },
    {
      amount: 45.00,
      type: 'expense',
      description: 'Restaurant Dinner',
      date: new Date(now.getFullYear(), now.getMonth(), 8),
      accountId: creditCard.id,
      categoryId: foodCategory?.id,
      userId: user.id,
    },
    {
      amount: 120.00,
      type: 'expense',
      description: 'Gas Station',
      date: new Date(now.getFullYear(), now.getMonth(), 10),
      accountId: creditCard.id,
      categoryId: transportCategory?.id,
      userId: user.id,
    },
    {
      amount: 250.00,
      type: 'expense',
      description: 'Clothing Store',
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      accountId: creditCard.id,
      categoryId: shoppingCategory?.id,
      userId: user.id,
    },
    {
      amount: 1200.00,
      type: 'expense',
      description: 'Rent Payment',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      accountId: checkingAccount.id,
      categoryId: billsCategory?.id,
      userId: user.id,
    },
    {
      amount: 150.00,
      type: 'expense',
      description: 'Electric Bill',
      date: new Date(now.getFullYear(), now.getMonth(), 3),
      accountId: checkingAccount.id,
      categoryId: billsCategory?.id,
      userId: user.id,
    },
    {
      amount: 65.00,
      type: 'expense',
      description: 'Internet Bill',
      date: new Date(now.getFullYear(), now.getMonth(), 3),
      accountId: checkingAccount.id,
      categoryId: billsCategory?.id,
      userId: user.id,
    },
    {
      amount: 42.00,
      type: 'expense',
      description: 'Coffee Shop',
      date: new Date(now.getFullYear(), now.getMonth(), 18),
      accountId: creditCard.id,
      categoryId: foodCategory?.id,
      userId: user.id,
    },
  ]

  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction })
  }

  console.log('✅ Created 10 transactions')

  console.log('\n🎉 Test data seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Email: demo@cashflow.com')
  console.log('   Password: password123')
  console.log('\n💰 Summary:')
  console.log('   Total Balance: $7,420.50')
  console.log('   Monthly Income: $5,000.00')
  console.log('   Monthly Expenses: $2,257.50')
  console.log('   Net Income: $2,742.50')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
