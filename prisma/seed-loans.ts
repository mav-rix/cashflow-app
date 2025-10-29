import { PrismaClient } from '@prisma/client';
import { generateAmortizationSchedule } from '../lib/loan-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding loan data...');

  // Find the demo user
  const user = await prisma.user.findUnique({
    where: { email: 'demo@cashflow.com' },
  });

  if (!user) {
    console.error('Demo user not found.');
    return;
  }

  // Sample loans
  const loans = [
    {
      name: 'Car Loan',
      type: 'auto',
      principal: 25000,
      currentBalance: 18500,
      interestRate: 4.5,
      termMonths: 60,
      startDate: new Date('2023-01-15'),
      monthlyPayment: 466.08,
      paymentDay: 15,
      lender: 'Chase Auto Finance',
      accountNumber: '****5678',
      color: '#3b82f6',
    },
    {
      name: 'Student Loan',
      type: 'student',
      principal: 45000,
      currentBalance: 38200,
      interestRate: 5.8,
      termMonths: 120,
      startDate: new Date('2020-09-01'),
      monthlyPayment: 496.79,
      paymentDay: 1,
      lender: 'Federal Student Aid',
      accountNumber: '****1234',
      color: '#8b5cf6',
    },
    {
      name: 'Credit Card - Visa',
      type: 'credit_card',
      principal: 5000,
      currentBalance: 3200,
      interestRate: 18.99,
      termMonths: 24,
      startDate: new Date('2024-06-01'),
      monthlyPayment: 250,
      paymentDay: 20,
      lender: 'Bank of America',
      accountNumber: '****9012',
      color: '#ef4444',
    },
  ];

  for (const loanData of loans) {
    // Calculate end date
    const endDate = new Date(loanData.startDate);
    endDate.setMonth(endDate.getMonth() + loanData.termMonths);
    const now = new Date();

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        ...loanData,
        endDate,
        isActive: true,
        isPaidOff: false,
      },
    });

    console.log(`✅ Created loan: ${loan.name}`);

    // Generate payment schedule
    const monthsRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    if (monthsRemaining > 0) {
      const schedule = generateAmortizationSchedule(
        loanData.currentBalance,
        loanData.interestRate,
        Math.min(monthsRemaining, loanData.termMonths),
        now,
        loanData.paymentDay
      );

      // Create payment records for next 12 months
      const paymentsToCreate = schedule.slice(0, Math.min(12, schedule.length));

      for (const payment of paymentsToCreate) {
        await prisma.loanPayment.create({
          data: {
            loanId: loan.id,
            dueDate: payment.dueDate,
            amount: payment.payment,
            principal: payment.principal,
            interest: payment.interest,
            status: 'pending',
          },
        });
      }

      console.log(`   📅 Created ${paymentsToCreate.length} payment records`);
    }
  }

  console.log('\n✅ Loan seeding complete!');
  
  const loanCount = await prisma.loan.count({ where: { userId: user.id } });
  const paymentCount = await prisma.loanPayment.count();
  
  console.log(`📊 Summary:`);
  console.log(`   Loans: ${loanCount}`);
  console.log(`   Scheduled Payments: ${paymentCount}`);
}

main()
  .catch((e) => {
    console.error('Error seeding loans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
