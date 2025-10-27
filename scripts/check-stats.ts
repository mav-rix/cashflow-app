import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@cashflow.com' },
  })

  if (!demoUser) {
    console.log('Demo user not found.')
    return
  }

  console.log('📊 Checking stats for demo@cashflow.com\n')

  // Get current month date range
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDayOfMonth.setHours(0, 0, 0, 0)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  lastDayOfMonth.setHours(23, 59, 59, 999)

  console.log('Date range:', {
    from: firstDayOfMonth.toLocaleDateString(),
    to: lastDayOfMonth.toLocaleDateString(),
  })

  // Get accounts
  const accounts = await prisma.account.findMany({
    where: { userId: demoUser.id, isActive: true },
  })

  console.log('\n💳 Accounts:')
  let totalBalance = 0
  accounts.forEach(acc => {
    console.log(`  ${acc.name}: ${acc.type === 'credit_card' ? '-' : ''}$${acc.balance.toFixed(2)}`)
    if (acc.type === 'credit_card') {
      totalBalance -= Math.abs(acc.balance)
    } else {
      totalBalance += acc.balance
    }
  })
  console.log(`  Total Balance: $${totalBalance.toFixed(2)}`)

  // Get transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: demoUser.id,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
    include: {
      category: true,
    },
  })

  console.log(`\n💰 Transactions (${transactions.length} total):`)
  
  let monthlyIncome = 0
  let monthlyExpenses = 0

  const incomeTransactions = transactions.filter(t => t.type === 'income')
  const expenseTransactions = transactions.filter(t => t.type === 'expense')

  console.log(`\n📈 Income (${incomeTransactions.length}):`)
  incomeTransactions.forEach(t => {
    monthlyIncome += Math.abs(t.amount)
    console.log(`  ${t.description || t.category?.name || 'Transaction'}: $${t.amount.toFixed(2)} (${new Date(t.date).toLocaleDateString()})`)
  })
  console.log(`  Total Income: $${monthlyIncome.toFixed(2)}`)

  console.log(`\n📉 Expenses (${expenseTransactions.length}):`)
  expenseTransactions.forEach(t => {
    monthlyExpenses += Math.abs(t.amount)
    console.log(`  ${t.description || t.category?.name || 'Transaction'}: $${t.amount.toFixed(2)} (${new Date(t.date).toLocaleDateString()})`)
  })
  console.log(`  Total Expenses: $${monthlyExpenses.toFixed(2)}`)

  const netIncome = monthlyIncome - monthlyExpenses

  console.log('\n📊 Summary:')
  console.log(`  Monthly Income: $${monthlyIncome.toFixed(2)}`)
  console.log(`  Monthly Expenses: $${monthlyExpenses.toFixed(2)}`)
  console.log(`  Net Income: $${netIncome.toFixed(2)}`)
  console.log(`  Savings Rate: ${monthlyIncome > 0 ? ((netIncome / monthlyIncome) * 100).toFixed(1) : '0'}%`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
