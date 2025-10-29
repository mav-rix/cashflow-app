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

  // Get or create account
  let account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'AUD',
        color: '#3b82f6',
        isActive: true,
      }
    })
    console.log('✅ Created account:', account.name)
  } else {
    console.log('📊 Using account:', account.name)
  }

  // Get categories
  const categories = await prisma.category.findMany({
    where: { userId: user.id }
  })

  console.log(`📋 Found ${categories.length} categories`)

  // Helper to find category
  const findCategory = (name: string, type: 'income' | 'expense') => {
    const cat = categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase() && c.type === type
    )
    if (cat) return cat
    
    // Fallback to first category of type
    return categories.find(c => c.type === type)
  }

  console.log('\n📥 Importing your data...\n')

  // INCOME SOURCE SECTION
  console.log('💰 Income Source Section:')
  const income = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Salary', 'income')!.id,
      amount: 1563.65,
      type: 'income',
      description: 'Super Retail Group',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { increment: 1563.65 } }
  })
  console.log('   ✅ Super Retail Group: $1,563.65 (income)')

  // FIXED COSTS SECTION
  console.log('\n💵 Fixed Costs Section:')
  
  // Rent
  const rent = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Rent', 'expense')!.id,
      amount: 720.00,
      type: 'expense',
      description: 'Rent - Weekly',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { decrement: 720.00 } }
  })
  console.log('   ✅ Rent: $720.00 (expense)')

  // Small Loan - Fundency (in Fixed Costs - treat as loan)
  const fundencyLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Small Loan - Fundency',
      type: 'personal',
      principal: 2500.00,
      currentBalance: 2500.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 248.28,
      paymentDay: 1,
      lender: 'Fundency',
      accountNumber: '',
      notes: 'Fortnightly payments',
      color: '#9333EA',
      paymentFrequency: 'biweekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Small Loan - Fundency: $2,500.00 principal, $248.28 fortnightly (loan)')

  // Loan - Afterpay (in Fixed Costs)
  const afterpayLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Loan - Afterpay',
      type: 'personal',
      principal: 170.00,
      currentBalance: 170.00,
      interestRate: 0,
      termMonths: 6,
      startDate: new Date(),
      monthlyPayment: 50.00,
      paymentDay: 1,
      lender: 'Afterpay',
      accountNumber: '',
      notes: 'Fortnightly payments',
      color: '#9333EA',
      paymentFrequency: 'biweekly',
      numberOfPayments: 6,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Loan - Afterpay: $170.00 principal, $50.00 fortnightly (loan)')

  // Utilities
  const utilities = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Utilities', 'expense')!.id,
      amount: 15.00,
      type: 'expense',
      description: 'Utilities - Elec, Gas, Water',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { decrement: 15.00 } }
  })
  console.log('   ✅ Utilities: $15.00 (expense)')

  // LOANS & DEBT SECTION
  console.log('\n💳 Loans & Debt Section:')

  // IRD Student Loan
  const studentLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'IRD Student Loan',
      type: 'student',
      principal: 44715.80,
      currentBalance: 44715.80,
      interestRate: 0,
      termMonths: 240,
      startDate: new Date(),
      monthlyPayment: 192.00,
      paymentDay: 1,
      lender: 'IRD',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 240,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ IRD Student Loan: $44,715.80 principal, $192.00 weekly')

  // Credit Card - CommBank
  const commbankCC = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'CommBank Credit Card',
      type: 'creditCard',
      principal: 3500.00,
      currentBalance: 3500.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 25.00,
      paymentDay: 1,
      lender: 'CommBank',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ CommBank Credit Card: $3,500.00 balance, $25.00 weekly')

  // Credit Card - NAB
  const nabCC = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'NAB Credit Card',
      type: 'creditCard',
      principal: 3500.00,
      currentBalance: 3500.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 25.00,
      paymentDay: 1,
      lender: 'NAB',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ NAB Credit Card: $3,500.00 balance, $25.00 weekly')

  // Credit Card - Coles
  const colesCC = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Coles Credit Card',
      type: 'creditCard',
      principal: 1000.00,
      currentBalance: 1000.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 25.00,
      paymentDay: 1,
      lender: 'Coles',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Coles Credit Card: $1,000.00 balance, $25.00 weekly')

  // Small Loan - Fundency (in Loans & Debt section - different from Fixed Costs one)
  const fundencyLoan2 = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Small Loan - Fundency #2',
      type: 'personal',
      principal: 1600.00,
      currentBalance: 1600.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 91.28,
      paymentDay: 1,
      lender: 'Fundency',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Small Loan - Fundency #2: $1,600.00 principal, $91.28 weekly')

  // Small Loan - Fundo Loans
  const fundoLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Small Loan - Fundo Loans',
      type: 'personal',
      principal: 1548.00,
      currentBalance: 1548.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 59.54,
      paymentDay: 1,
      lender: 'Fundo Loans',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Small Loan - Fundo Loans: $1,548.00 principal, $59.54 weekly')

  // Small Loan - Wallet Wizard
  const walletWizard = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'Small Loan - Wallet Wizard',
      type: 'personal',
      principal: 1200.00,
      currentBalance: 1200.00,
      interestRate: 0,
      termMonths: 12,
      startDate: new Date(),
      monthlyPayment: 74.80,
      paymentDay: 1,
      lender: 'Wallet Wizard',
      accountNumber: '',
      notes: 'Weekly payments',
      color: '#9333EA',
      paymentFrequency: 'weekly',
      numberOfPayments: 12,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ Small Loan - Wallet Wizard: $1,200.00 principal, $74.80 weekly')

  // DISCRETIONARY SECTION
  console.log('\n🛍️  Discretionary Section:')

  // Health - Preventer
  const health = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Healthcare', 'expense')!.id,
      amount: 5.00,
      type: 'expense',
      description: 'Health - Preventer',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { decrement: 5.00 } }
  })
  console.log('   ✅ Health - Preventer: $5.00 (expense)')

  // Internet - Superloop
  const internet = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Subscriptions', 'expense')!.id,
      amount: 106.00,
      type: 'expense',
      description: 'Internet - Superloop',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { decrement: 106.00 } }
  })
  console.log('   ✅ Internet - Superloop: $106.00 (expense)')

  // Mobile - Optus
  const mobile = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: findCategory('Subscriptions', 'expense')!.id,
      amount: 107.46,
      type: 'expense',
      description: 'Mobile - Optus',
      date: new Date(),
    }
  })
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: { decrement: 107.46 } }
  })
  console.log('   ✅ Mobile - Optus: $107.46 (expense)')

  // BNPL - Afterpay (Discretionary)
  const bnplAfterpay = await prisma.loan.create({
    data: {
      userId: user.id,
      name: 'BNPL - Afterpay',
      type: 'personal',
      principal: 2000.00,
      currentBalance: 2000.00,
      interestRate: 0,
      termMonths: 6,
      startDate: new Date(),
      monthlyPayment: 300.00,
      paymentDay: 2,
      lender: 'Afterpay',
      accountNumber: '',
      notes: 'Monthly payments on 2nd',
      color: '#9333EA',
      paymentFrequency: 'monthly',
      numberOfPayments: 6,
      feeAmount: 0,
      allowSplitPayment: false,
    }
  })
  console.log('   ✅ BNPL - Afterpay: $2,000.00 principal, $300.00 monthly')

  console.log('\n✨ Import complete!')
  
  // Show summary
  const transactionCount = await prisma.transaction.count({ where: { userId: user.id } })
  const loanCount = await prisma.loan.count({ where: { userId: user.id } })
  const updatedAccount = await prisma.account.findUnique({ where: { id: account.id } })
  
  console.log(`\n📊 Summary:`)
  console.log(`   Income Transactions: 1`)
  console.log(`   Expense Transactions: 5`)
  console.log(`   Total Transactions: ${transactionCount}`)
  console.log(`   Loans: ${loanCount}`)
  console.log(`   Account Balance: $${updatedAccount?.balance.toFixed(2)}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
