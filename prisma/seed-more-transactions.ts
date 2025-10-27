import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding additional transactions...');

  // Find the demo user
  const user = await prisma.user.findUnique({
    where: { email: 'demo@cashflow.com' },
  });

  if (!user) {
    console.error('Demo user not found. Please run seed-test-data.ts first.');
    return;
  }

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  if (accounts.length === 0) {
    console.error('No accounts found. Please run seed-test-data.ts first.');
    return;
  }

  const checkingAccount = accounts.find((a) => a.type === 'checking') || accounts[0];
  const savingsAccount = accounts.find((a) => a.type === 'savings') || accounts[1];
  const creditCard = accounts.find((a) => a.type === 'credit_card') || accounts[2];

  // Get categories (including default ones or user's own)
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: null, isDefault: true },
      ],
    },
  });

  if (categories.length === 0) {
    console.error('No categories found. Please run seed.ts first.');
    return;
  }

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Create diverse transactions for testing
  const transactions = [
    // Recent income transactions
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: incomeCategories.find((c) => c.name === 'Salary')?.id || incomeCategories[0].id,
      type: 'income' as const,
      amount: 4500.00,
      description: 'Monthly Salary - October',
      date: new Date('2025-10-01'),
      notes: 'Regular monthly paycheck',
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: incomeCategories.find((c: any) => c.name === 'Freelance')?.id || incomeCategories[1].id,
      type: 'income' as const,
      amount: 850.00,
      description: 'Freelance Web Design Project',
      date: new Date('2025-10-15'),
      notes: 'Client: ABC Company',
    },
    {
      userId: user.id,
      accountId: savingsAccount?.id || checkingAccount.id,
      categoryId: incomeCategories.find((c: any) => c.name === 'Investment')?.id || incomeCategories[2].id,
      type: 'income' as const,
      amount: 125.50,
      description: 'Dividend Payment',
      date: new Date('2025-10-20'),
    },

    // Recent expense transactions - Housing
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Rent')?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 1800.00,
      description: 'Monthly Rent',
      date: new Date('2025-10-01'),
      notes: 'Apartment rent',
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Utilities')?.id || expenseCategories[1].id,
      type: 'expense' as const,
      amount: 145.80,
      description: 'Electricity Bill',
      date: new Date('2025-10-05'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Utilities')?.id || expenseCategories[1].id,
      type: 'expense' as const,
      amount: 65.00,
      description: 'Internet Service',
      date: new Date('2025-10-05'),
    },

    // Groceries & Food
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Groceries')?.id || expenseCategories[2].id,
      type: 'expense' as const,
      amount: 125.45,
      description: 'Weekly Grocery Shopping',
      date: new Date('2025-10-07'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Groceries')?.id || expenseCategories[2].id,
      type: 'expense' as const,
      amount: 89.30,
      description: 'Whole Foods Market',
      date: new Date('2025-10-14'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Dining Out')?.id || expenseCategories[3].id,
      type: 'expense' as const,
      amount: 45.50,
      description: 'Dinner at Italian Restaurant',
      date: new Date('2025-10-12'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Dining Out')?.id || expenseCategories[3].id,
      type: 'expense' as const,
      amount: 12.50,
      description: 'Coffee Shop',
      date: new Date('2025-10-16'),
    },

    // Transportation
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Transportation')?.id || expenseCategories[4].id,
      type: 'expense' as const,
      amount: 65.00,
      description: 'Gas Fill-up',
      date: new Date('2025-10-08'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Transportation')?.id || expenseCategories[4].id,
      type: 'expense' as const,
      amount: 25.00,
      description: 'Uber Ride',
      date: new Date('2025-10-18'),
    },

    // Entertainment & Shopping
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Entertainment')?.id || expenseCategories[5].id,
      type: 'expense' as const,
      amount: 15.99,
      description: 'Netflix Subscription',
      date: new Date('2025-10-10'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Entertainment')?.id || expenseCategories[5].id,
      type: 'expense' as const,
      amount: 35.00,
      description: 'Movie Tickets',
      date: new Date('2025-10-19'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Shopping')?.id || expenseCategories[6].id,
      type: 'expense' as const,
      amount: 89.99,
      description: 'Clothing Purchase',
      date: new Date('2025-10-21'),
    },

    // Healthcare & Insurance
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Healthcare')?.id || expenseCategories[7].id,
      type: 'expense' as const,
      amount: 30.00,
      description: 'Doctor Co-pay',
      date: new Date('2025-10-11'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Insurance')?.id || expenseCategories[8].id,
      type: 'expense' as const,
      amount: 220.00,
      description: 'Car Insurance - Monthly',
      date: new Date('2025-10-01'),
    },

    // Savings transfer
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Other')?.id || expenseCategories[9].id,
      type: 'expense' as const,
      amount: 500.00,
      description: 'Transfer to Savings',
      date: new Date('2025-10-15'),
      notes: 'Monthly savings goal',
    },

    // More recent transactions (last few days)
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Groceries')?.id || expenseCategories[2].id,
      type: 'expense' as const,
      amount: 67.80,
      description: 'Trader Joe\'s',
      date: new Date('2025-10-23'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Dining Out')?.id || expenseCategories[3].id,
      type: 'expense' as const,
      amount: 28.75,
      description: 'Lunch at Chipotle',
      date: new Date('2025-10-24'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Transportation')?.id || expenseCategories[4].id,
      type: 'expense' as const,
      amount: 55.00,
      description: 'Gas Station',
      date: new Date('2025-10-25'),
    },
  ];

  // Calculate balance updates for each account
  const accountBalanceUpdates: { [key: string]: number } = {};

  for (const transaction of transactions) {
    if (!accountBalanceUpdates[transaction.accountId]) {
      accountBalanceUpdates[transaction.accountId] = 0;
    }

    if (transaction.type === 'income') {
      accountBalanceUpdates[transaction.accountId] += transaction.amount;
    } else {
      accountBalanceUpdates[transaction.accountId] -= transaction.amount;
    }
  }

  // Create all transactions
  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: transaction,
    });
  }

  // Update account balances
  for (const [accountId, balanceChange] of Object.entries(accountBalanceUpdates)) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (account) {
      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: account.balance + balanceChange,
        },
      });
    }
  }

  console.log(`✅ Created ${transactions.length} additional transactions`);
  console.log('📊 Updated account balances');
  
  // Show summary
  const updatedAccounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  console.log('\n💰 Account Balances:');
  updatedAccounts.forEach(account => {
    console.log(`  ${account.name}: $${account.balance.toFixed(2)}`);
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  console.log('\n📈 Transaction Summary:');
  console.log(`  Total Income: $${totalIncome.toFixed(2)}`);
  console.log(`  Total Expenses: $${totalExpenses.toFixed(2)}`);
  console.log(`  Net: $${(totalIncome - totalExpenses).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
