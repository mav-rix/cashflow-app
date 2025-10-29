import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@cashflow.com' },
  })

  if (!demoUser) {
    console.log('Demo user not found. Please run the main seed first.')
    return
  }

  console.log('Creating BNPL and Payday loans for demo user...')

  // 1. BNPL Loan (Afterpay-style)
  const bnplStartDate = new Date()
  bnplStartDate.setDate(bnplStartDate.getDate() - 7) // Started 1 week ago

  const bnplLoan = await prisma.loan.create({
    data: {
      userId: demoUser.id,
      name: 'Furniture Purchase',
      type: 'bnpl',
      principal: 800,
      currentBalance: 600, // Already paid 1 installment
      interestRate: 0, // BNPL typically has 0% interest
      termMonths: 2, // ~2 months for 4 biweekly payments
      startDate: bnplStartDate,
      endDate: new Date(bnplStartDate.getTime() + 56 * 24 * 60 * 60 * 1000), // 8 weeks
      monthlyPayment: 200, // $800 / 4 payments = $200
      paymentDay: bnplStartDate.getDate(),
      lender: 'Afterpay',
      paymentFrequency: 'biweekly',
      numberOfPayments: 4,
      feeAmount: 0,
      allowSplitPayment: false,
      color: '#9333EA', // Purple
      isActive: true,
      isPaidOff: false,
    },
  })

  console.log('Created BNPL loan:', bnplLoan.name)

  // Generate 4 biweekly payments
  const bnplPayments = []
  for (let i = 0; i < 4; i++) {
    const dueDate = new Date(bnplStartDate)
    dueDate.setDate(dueDate.getDate() + (14 * i)) // Every 2 weeks

    bnplPayments.push({
      loanId: bnplLoan.id,
      dueDate,
      amount: 200,
      principal: 200,
      interest: 0,
      status: i === 0 ? 'paid' : 'pending', // First payment already made
      paymentDate: i === 0 ? new Date(bnplStartDate.getTime() + 24 * 60 * 60 * 1000) : null,
    })
  }

  await prisma.loanPayment.createMany({
    data: bnplPayments,
  })

  console.log('Created 4 BNPL payments')

  // 2. Payday Loan with Split Payment
  const paydayStartDate = new Date()
  paydayStartDate.setDate(paydayStartDate.getDate() - 3) // Started 3 days ago

  const paydayLoan = await prisma.loan.create({
    data: {
      userId: demoUser.id,
      name: 'Emergency Cash Advance',
      type: 'payday',
      principal: 500,
      currentBalance: 575, // Principal + fees
      interestRate: 391.07, // Typical payday loan APR (calculated from fees)
      termMonths: 1, // 1 month term
      startDate: paydayStartDate,
      endDate: new Date(paydayStartDate.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
      monthlyPayment: 287.50, // Split into 2 payments
      paymentDay: paydayStartDate.getDate(),
      lender: 'QuickCash Lending',
      paymentFrequency: null,
      numberOfPayments: null,
      feeAmount: 75, // 15% fee on $500
      allowSplitPayment: true,
      color: '#EAB308', // Yellow/gold
      isActive: true,
      isPaidOff: false,
    },
  })

  console.log('Created Payday loan:', paydayLoan.name)

  // Generate 2 split payments
  const paydayPayment1 = new Date(paydayStartDate)
  paydayPayment1.setDate(paydayPayment1.getDate() + 14) // 2 weeks

  const paydayPayment2 = new Date(paydayStartDate)
  paydayPayment2.setDate(paydayPayment2.getDate() + 28) // 4 weeks

  await prisma.loanPayment.createMany({
    data: [
      {
        loanId: paydayLoan.id,
        dueDate: paydayPayment1,
        amount: 287.50,
        principal: 287.50,
        interest: 0,
        status: 'pending',
      },
      {
        loanId: paydayLoan.id,
        dueDate: paydayPayment2,
        amount: 287.50,
        principal: 287.50,
        interest: 0,
        status: 'pending',
      },
    ],
  })

  console.log('Created 2 payday loan split payments')

  // 3. BNPL Loan (Weekly payments)
  const bnplWeeklyStartDate = new Date()
  bnplWeeklyStartDate.setDate(bnplWeeklyStartDate.getDate() + 2) // Starts in 2 days

  const bnplWeekly = await prisma.loan.create({
    data: {
      userId: demoUser.id,
      name: 'Electronics - Klarna',
      type: 'bnpl',
      principal: 400,
      currentBalance: 400,
      interestRate: 0,
      termMonths: 1, // ~1 month for 4 weekly payments
      startDate: bnplWeeklyStartDate,
      endDate: new Date(bnplWeeklyStartDate.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
      monthlyPayment: 100, // $400 / 4 payments = $100
      paymentDay: bnplWeeklyStartDate.getDate(),
      lender: 'Klarna',
      paymentFrequency: 'weekly',
      numberOfPayments: 4,
      feeAmount: 10, // Small late fee if missed
      allowSplitPayment: false,
      color: '#EC4899', // Pink
      isActive: true,
      isPaidOff: false,
    },
  })

  console.log('Created weekly BNPL loan:', bnplWeekly.name)

  // Generate 4 weekly payments
  const weeklyPayments = []
  for (let i = 0; i < 4; i++) {
    const dueDate = new Date(bnplWeeklyStartDate)
    dueDate.setDate(dueDate.getDate() + (7 * i)) // Every week

    weeklyPayments.push({
      loanId: bnplWeekly.id,
      dueDate,
      amount: 100,
      principal: 100,
      interest: 0,
      status: 'pending',
    })
  }

  await prisma.loanPayment.createMany({
    data: weeklyPayments,
  })

  console.log('Created 4 weekly BNPL payments')

  console.log('\n✅ Successfully created special loans!')
  console.log('- 1 BNPL loan (biweekly, Afterpay)')
  console.log('- 1 Payday loan (split payment)')
  console.log('- 1 BNPL loan (weekly, Klarna)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
