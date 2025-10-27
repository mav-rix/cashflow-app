import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLoans() {
  // Get or create user
  let user = await prisma.user.findFirst();
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'user@cashflow.app',
        name: 'Demo User',
        password: 'demo123', // Add required password field
      }
    });
  }
  
  const userId = user.id;
  console.log(`Adding loans for user: ${user.email}\n`);

  const loans = [
    { name: 'Small Loan - Fundency', lender: 'Fundency', principal: 2500.00, payment: 248.28, frequency: 'biweekly', day: 2, rate: 0, type: 'personal' },
    { name: 'Loan - Afterpay', lender: 'Afterpay', principal: 170.00, payment: 50.00, frequency: 'biweekly', day: 2, rate: 0, type: 'bnpl' },
    { name: 'IRD Student Loan', lender: 'IRD', principal: 44715.80, payment: 192.00, frequency: 'weekly', day: 2, rate: 0, type: 'student' },
    { name: 'CommBank CC', lender: 'Commonwealth Bank', principal: 3500.00, payment: 25.00, frequency: 'weekly', day: 2, rate: 19.74, type: 'credit_card' },
    { name: 'NAB CC', lender: 'NAB', principal: 3500.00, payment: 25.00, frequency: 'weekly', day: 2, rate: 19.74, type: 'credit_card' },
    { name: 'Coles CC', lender: 'Coles', principal: 1000.00, payment: 25.00, frequency: 'weekly', day: 2, rate: 19.74, type: 'credit_card' },
    { name: 'Small Loan - Fundency 2', lender: 'Fundency', principal: 1600.00, payment: 91.28, frequency: 'weekly', day: 2, rate: 0, type: 'personal' },
    { name: 'Small Loan - Fundo', lender: 'Fundo Loans', principal: 1548.00, payment: 59.54, frequency: 'weekly', day: 2, rate: 0, type: 'personal' },
    { name: 'Small Loan - Wallet Wizard', lender: 'Wallet Wizard', principal: 1200.00, payment: 74.80, frequency: 'weekly', day: 2, rate: 0, type: 'personal' },
    { name: 'Afterpay BNPL', lender: 'Afterpay', principal: 2000.00, payment: 300.00, frequency: 'monthly', day: 2, rate: 0, type: 'bnpl' },
  ];

  for (const loan of loans) {
    const existing = await prisma.loan.findFirst({
      where: { 
        userId, 
        name: loan.name
      }
    });

    if (!existing) {
      const startDate = new Date('2025-01-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 60); // 5 year term

      await prisma.loan.create({
        data: {
          userId,
          name: loan.name,
          type: loan.type,
          principal: loan.principal,
          currentBalance: loan.principal,
          interestRate: loan.rate,
          termMonths: 60,
          startDate,
          endDate,
          monthlyPayment: loan.payment,
          paymentDay: loan.day,
          lender: loan.lender,
          paymentFrequency: loan.frequency,
          isActive: true,
          isPaidOff: false,
        }
      });
      console.log(`✓ Added: ${loan.name} ($${loan.payment} ${loan.frequency})`);
    } else {
      console.log(`- ${loan.name} already exists`);
    }
  }

  console.log('\n✅ Loans added successfully!');
  const totalLoans = await prisma.loan.count({ where: { userId, isActive: true } });
  console.log(`Total active loans: ${totalLoans}`);
}

addLoans()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
