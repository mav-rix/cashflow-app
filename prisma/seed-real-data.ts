import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding real financial data...');

  // Create/update user
  const hashedPassword = await hashPassword('password123');

  const user = await prisma.user.upsert({
    where: { email: 'demo@cashflow.com' },
    update: {
      name: 'Demo User',
      currency: 'AUD',
    },
    create: {
      email: 'demo@cashflow.com',
      name: 'Demo User',
      password: hashedPassword,
      currency: 'AUD',
    },
  });

  console.log('✅ User ready: demo@cashflow.com');

  // Clear existing user data
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.loanPayment.deleteMany({ where: { loan: { userId: user.id } } });
  await prisma.loan.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  console.log('✅ Cleared existing data');

  // Create accounts
  const checkingAccount = await prisma.account.create({
    data: {
      name: 'Main Checking',
      type: 'checking',
      balance: 1563.65, // Starting with income amount
      currency: 'AUD',
      description: 'Primary account for Super Retail Group income',
      color: '#3b82f6',
      userId: user.id,
    },
  });

  const savingsAccount = await prisma.account.create({
    data: {
      name: 'Savings',
      type: 'savings',
      balance: 0,
      currency: 'AUD',
      description: 'Emergency savings',
      color: '#10b981',
      userId: user.id,
    },
  });

  console.log('✅ Created 2 accounts');

  // Get categories
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: null, isDefault: true },
      ],
    },
  });

  const getCategory = (name: string) => categories.find(c => c.name === name);

  const salaryCategory = getCategory('Salary');
  const housingCategory = getCategory('Housing');
  const billsCategory = getCategory('Bills & Utilities');
  const shoppingCategory = getCategory('Shopping');
  const entertainmentCategory = getCategory('Entertainment');
  const subscriptionsCategory = getCategory('Subscriptions');

  // Current date for transactions
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();

  // Create income transaction
  await prisma.transaction.create({
    data: {
      amount: 1563.65,
      type: 'income',
      description: 'Super Retail Group - Salary',
      date: firstOfMonth,
      accountId: checkingAccount.id,
      categoryId: salaryCategory?.id,
      userId: user.id,
      isRecurring: true,
      recurrence: 'weekly', // Fortnightly approximated as weekly
      bonusAmount: 272.00, // On-call bonus
      includeBonusNext: false,
    },
  });

  console.log('✅ Created income transaction');

  // Create loans for all debts
  const loans = [
    {
      name: 'IRD Student Loan',
      type: 'student',
      principal: 44715.80,
      currentBalance: 44715.80,
      interestRate: 0,
      monthlyPayment: 192.00 * 4.33, // Weekly to monthly approximation
      paymentDay: 7, // 7th of each month
      termMonths: 180, // Approximate 15 years
      startDate: new Date(2020, 0, 1),
      lender: 'IRD',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $192.00',
    },
    {
      name: 'CommBank Credit Card',
      type: 'credit_card',
      principal: 3500.00,
      currentBalance: 3500.00,
      interestRate: 19.99,
      monthlyPayment: 25.00 * 4.33,
      paymentDay: 15,
      termMonths: 36,
      startDate: new Date(2022, 0, 1),
      lender: 'CommBank',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $25.00',
    },
    {
      name: 'NAB Credit Card',
      type: 'credit_card',
      principal: 3500.00,
      currentBalance: 3500.00,
      interestRate: 19.99,
      monthlyPayment: 25.00 * 4.33,
      paymentDay: 20,
      termMonths: 36,
      startDate: new Date(2022, 0, 1),
      lender: 'NAB',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $25.00',
    },
    {
      name: 'Coles Credit Card',
      type: 'credit_card',
      principal: 1000.00,
      currentBalance: 1000.00,
      interestRate: 19.99,
      monthlyPayment: 25.00 * 4.33,
      paymentDay: 10,
      termMonths: 24,
      startDate: new Date(2023, 0, 1),
      lender: 'Coles',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $25.00',
    },
    {
      name: 'Fundency Small Loan',
      type: 'personal',
      principal: 1600.00,
      currentBalance: 1600.00,
      interestRate: 48.0,
      monthlyPayment: 91.28 * 4.33,
      paymentDay: 5,
      termMonths: 12,
      startDate: new Date(2024, 6, 1),
      lender: 'Fundency',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $91.28',
    },
    {
      name: 'Fundo Loans',
      type: 'personal',
      principal: 1548.00,
      currentBalance: 1548.00,
      interestRate: 48.0,
      monthlyPayment: 59.54 * 4.33,
      paymentDay: 12,
      termMonths: 12,
      startDate: new Date(2024, 7, 1),
      lender: 'Fundo Loans',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $59.54',
    },
    {
      name: 'Wallet Wizard',
      type: 'personal',
      principal: 1200.00,
      currentBalance: 1200.00,
      interestRate: 48.0,
      monthlyPayment: 74.80 * 4.33,
      paymentDay: 18,
      termMonths: 12,
      startDate: new Date(2024, 8, 1),
      lender: 'Wallet Wizard',
      paymentFrequency: 'weekly',
      notes: 'Weekly payment: $74.80',
    },
    {
      name: 'Afterpay BNPL',
      type: 'bnpl',
      principal: 2000.00,
      currentBalance: 2000.00,
      interestRate: 0,
      monthlyPayment: 300.00,
      paymentDay: 2,
      termMonths: 6,
      startDate: new Date(2024, 9, 1),
      lender: 'Afterpay',
      paymentFrequency: 'monthly',
      numberOfPayments: 4,
      notes: 'BNPL installment: $300.00',
    },
  ];

  for (const loanData of loans) {
    await prisma.loan.create({
      data: {
        ...loanData,
        userId: user.id,
        isDisabled: false,
      },
    });
  }

  console.log(`✅ Created ${loans.length} loans`);

  // Create recurring expense transactions
  const expenses = [
    {
      amount: 720.00,
      description: 'Rent Payment',
      categoryId: housingCategory?.id,
      recurrence: 'weekly',
    },
    {
      amount: 248.28,
      description: 'Small Loan - Fundency (Fixed Cost)',
      categoryId: billsCategory?.id,
      recurrence: 'weekly', // Fortnightly approximated as weekly
    },
    {
      amount: 50.00,
      description: 'Afterpay Payment (Loan)',
      categoryId: shoppingCategory?.id,
      recurrence: 'weekly', // Fortnightly approximated as weekly
    },
    {
      amount: 15.00,
      description: 'Utilities - Elec, Gas, Water',
      categoryId: billsCategory?.id,
      recurrence: 'weekly',
    },
    {
      amount: 5.00,
      description: 'Health - Preventir',
      categoryId: billsCategory?.id,
      recurrence: 'weekly',
    },
    {
      amount: 106.00,
      description: 'Internet - Superloop',
      categoryId: subscriptionsCategory?.id,
      recurrence: 'monthly',
    },
    {
      amount: 107.46,
      description: 'Mobile - Optus',
      categoryId: subscriptionsCategory?.id,
      recurrence: 'monthly',
    },
  ];

  // Create the recurring transactions
  let transactionCount = 0;
  for (const expense of expenses) {
    await prisma.transaction.create({
      data: {
        amount: expense.amount,
        type: 'expense',
        description: expense.description,
        date: today,
        accountId: checkingAccount.id,
        categoryId: expense.categoryId,
        userId: user.id,
        isRecurring: true,
        recurrence: expense.recurrence,
      },
    });
    transactionCount++;
  }

  // Update checking account balance to reflect the actual transaction data
  // Income ($1563.65) - all expense transactions = net balance
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = 1563.65;

  // Calculate balance: income - expenses (loans are not included as transactions)
  const realBalance = totalIncome - totalExpenses;

  await prisma.account.update({
    where: { id: checkingAccount.id },
    data: { balance: realBalance }, // Set to actual net from transactions
  });

  const totalDebt = loans.reduce((sum, l) => sum + l.principal, 0);
  const weeklyExpenses = expenses.filter(e => e.recurrence === 'weekly').reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = expenses.filter(e => e.recurrence === 'monthly').reduce((sum, e) => sum + e.amount, 0);

  console.log(`✅ Created ${transactionCount} recurring expense transactions`);
  console.log('\n🎉 Real financial data seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: demo@cashflow.com');
  console.log('   Password: password123');
  console.log('\n💰 Financial Summary:');
  console.log('   Income: $1,563.65');
  console.log('   On-Call Bonus Available: $272.00');
  console.log(`   Total Debt: $${totalDebt.toFixed(2)}`);
  console.log(`   Weekly Expenses: $${weeklyExpenses.toFixed(2)}`);
  console.log(`   Monthly Expenses: $${monthlyExpenses.toFixed(2)}`);
  console.log(`   Weekly Loan Payments: $${totalWeeklyLoanPayments.toFixed(2)}`);
  console.log('\n📊 Debt Breakdown:');
  console.log('   - Student Loans: $44,715.80');
  console.log('   - Credit Cards: $8,000.00');
  console.log('   - Personal Loans: $4,348.00');
  console.log('   - BNPL: $2,000.00');
  console.log('\n📊 Accounts Created:');
  console.log('   - Main Checking (starting balance reflects income)');
  console.log('   - Savings (empty)');
  console.log('\n🔄 Recurring Transactions:');
  console.log('   - 1 income transaction (salary with bonus option)');
  console.log(`   - ${transactionCount} expense transactions`);
  console.log(`   - ${loans.length} loan entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding real data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
