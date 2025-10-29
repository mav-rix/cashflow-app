import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupFinancialData() {
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
    console.log('✓ Created demo user');
  }
  
  const userId = user.id;
  console.log(`Using user: ${user.email} (ID: ${userId})\n`);

  // Get default account
  let account = await prisma.account.findFirst({
    where: { userId }
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'AUD',
      }
    });
    console.log('✓ Created default account');
  }

  // Get or create default category
  let incomeCategory = await prisma.category.findFirst({
    where: { userId, type: 'income' }
  });

  if (!incomeCategory) {
    incomeCategory = await prisma.category.create({
      data: {
        userId,
        name: 'Salary',
        type: 'income',
        color: '#10b981',
      }
    });
  }

  let expenseCategory = await prisma.category.findFirst({
    where: { userId, type: 'expense' }
  });

  if (!expenseCategory) {
    expenseCategory = await prisma.category.create({
      data: {
        userId,
        name: 'Bills',
        type: 'expense',
        color: '#ef4444',
      }
    });
  }

  console.log('✓ Categories ready\n');

  // STEP 1: Convert existing transactions to recurring
  console.log('Step 1: Converting existing transactions to recurring...');
  const existingTransactions = await prisma.transaction.findMany({
    where: { userId, isRecurring: false }
  });

  for (const txn of existingTransactions) {
    // Determine recurrence based on description
    let recurrence = 'monthly';
    if (txn.description?.toLowerCase().includes('rent') || 
        txn.description?.toLowerCase().includes('transport')) {
      recurrence = 'weekly';
    } else if (txn.description?.toLowerCase().includes('health') ||
               txn.description?.toLowerCase().includes('insurance')) {
      recurrence = 'biweekly';
    }

    await prisma.transaction.update({
      where: { id: txn.id },
      data: {
        isRecurring: true,
        recurrence: recurrence,
      }
    });
    console.log(`  ✓ Converted: ${txn.description} → ${recurrence}`);
  }

  // STEP 2: Add income with bonus
  console.log('\nStep 2: Adding income...');
  const payday = new Date('2025-10-28'); // Tuesday
  
  const existingIncome = await prisma.transaction.findFirst({
    where: { 
      userId, 
      description: 'Super Retail Group',
      type: 'income'
    }
  });

  if (!existingIncome) {
    await prisma.transaction.create({
      data: {
        userId,
        accountId: account.id,
        categoryId: incomeCategory.id,
        description: 'Super Retail Group',
        amount: 1563.65,
        bonusAmount: 272.00,
        includeBonusNext: false,
        type: 'income',
        date: payday,
        isRecurring: true,
        recurrence: 'biweekly',
      }
    });
    console.log('  ✓ Added: Super Retail Group (biweekly income with bonus)');
  } else {
    console.log('  - Income already exists');
  }

  // STEP 3: Add expenses
  console.log('\nStep 3: Adding expenses...');
  const expenses = [
    { name: 'Rent', amount: 400.00, recurrence: 'weekly' },
    { name: 'Phone', amount: 41.66, recurrence: 'monthly' },
    { name: 'Internet', amount: 85.00, recurrence: 'monthly' },
    { name: 'Power', amount: 75.00, recurrence: 'monthly' },
    { name: 'Private Health Insurance', amount: 65.41, recurrence: 'biweekly' },
    { name: 'Public Transport', amount: 15.00, recurrence: 'weekly' },
    { name: 'Life Insurance', amount: 33.34, recurrence: 'monthly' },
  ];

  for (const expense of expenses) {
    const existing = await prisma.transaction.findFirst({
      where: { 
        userId, 
        description: expense.name,
        type: 'expense'
      }
    });

    if (!existing) {
      await prisma.transaction.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: expenseCategory.id,
          description: expense.name,
          amount: expense.amount,
          type: 'expense',
          date: payday,
          isRecurring: true,
          recurrence: expense.recurrence,
        }
      });
      console.log(`  ✓ Added: ${expense.name} (${expense.recurrence})`);
    } else {
      console.log(`  - ${expense.name} already exists`);
    }
  }

  // STEP 4: Add loans
  console.log('\nStep 4: Adding loans...');
  const loans = [
    { name: 'Beforepay', lender: 'Beforepay', principal: 200, payment: 51.02, frequency: 'weekly', day: 2, rate: 0 },
    { name: 'Zip Pay', lender: 'Zip', principal: 1000, payment: 40.00, frequency: 'weekly', day: 2, rate: 0 },
    { name: 'Commbank Credit Card', lender: 'Commonwealth Bank', principal: 15000, payment: 450.00, frequency: 'monthly', day: 28, rate: 19.74 },
    { name: 'Latitude Credit Card', lender: 'Latitude Financial', principal: 3000, payment: 90.00, frequency: 'monthly', day: 28, rate: 19.74 },
    { name: 'Personal Loan', lender: 'Commonwealth Bank', principal: 8000, payment: 320.00, frequency: 'biweekly', day: 2, rate: 8.99 },
    { name: 'Car Loan', lender: 'Bank of Melbourne', principal: 25000, payment: 500.00, frequency: 'biweekly', day: 2, rate: 7.5 },
    { name: 'HECS Debt', lender: 'ATO', principal: 30000, payment: 400.00, frequency: 'monthly', day: 28, rate: 0 },
    { name: 'Afterpay', lender: 'Afterpay', principal: 500, payment: 125.00, frequency: 'biweekly', day: 2, rate: 0 },
    { name: 'Klarna', lender: 'Klarna', principal: 300, payment: 75.00, frequency: 'biweekly', day: 2, rate: 0 },
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
          type: loan.name.includes('Credit Card') ? 'credit_card' : 
                loan.name.includes('HECS') ? 'student' :
                loan.name.includes('Car') ? 'auto' :
                loan.name.includes('Afterpay') || loan.name.includes('Klarna') ? 'bnpl' : 'personal',
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
      console.log(`  ✓ Added: ${loan.name} ($${loan.payment} ${loan.frequency})`);
    } else {
      console.log(`  - ${loan.name} already exists`);
    }
  }

  console.log('\n✅ Financial data setup complete!');
  console.log('\nSummary:');
  const totalTransactions = await prisma.transaction.count({ where: { userId } });
  const totalLoans = await prisma.loan.count({ where: { userId, isActive: true } });
  console.log(`  Transactions: ${totalTransactions}`);
  console.log(`  Active Loans: ${totalLoans}`);
}

setupFinancialData()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
