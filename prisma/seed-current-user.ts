import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('Please provide a user email as argument');
    console.log('Usage: npm run db:seed:user <email>');
    process.exit(1);
  }

  console.log(`🌱 Seeding transactions for ${userEmail}...`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`User ${userEmail} not found.`);
    process.exit(1);
  }

  // Check if user has accounts
  const existingAccounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  let accounts = existingAccounts;

  // Create accounts if none exist
  if (accounts.length === 0) {
    console.log('Creating default accounts...');
    const newAccounts = await Promise.all([
      prisma.account.create({
        data: {
          userId: user.id,
          name: 'Main Checking',
          type: 'checking',
          balance: 0,
          currency: 'USD',
        },
      }),
      prisma.account.create({
        data: {
          userId: user.id,
          name: 'Savings',
          type: 'savings',
          balance: 0,
          currency: 'USD',
        },
      }),
      prisma.account.create({
        data: {
          userId: user.id,
          name: 'Credit Card',
          type: 'credit_card',
          balance: 0,
          currency: 'USD',
        },
      }),
    ]);
    accounts = newAccounts;
    console.log('✅ Created 3 accounts');
  }

  const checkingAccount = accounts.find((a) => a.type === 'checking') || accounts[0];
  const savingsAccount = accounts.find((a) => a.type === 'savings') || accounts[1];
  const creditCard = accounts.find((a) => a.type === 'credit_card') || accounts[2];

  // Get categories
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: null, isDefault: true },
      ],
    },
  });

  if (categories.length === 0) {
    console.error('No categories found. Please run: npm run db:seed');
    process.exit(1);
  }

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Create transactions
  const transactions = [
    // Income
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: incomeCategories.find((c) => c.name === 'Salary')?.id || incomeCategories[0].id,
      type: 'income' as const,
      amount: 4500.00,
      description: 'Monthly Salary - October',
      date: new Date('2025-10-01'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: incomeCategories.find((c) => c.name === 'Freelance')?.id || incomeCategories[1]?.id || incomeCategories[0].id,
      type: 'income' as const,
      amount: 850.00,
      description: 'Freelance Project',
      date: new Date('2025-10-15'),
    },
    // Expenses
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Rent')?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 1800.00,
      description: 'Monthly Rent',
      date: new Date('2025-10-01'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Utilities')?.id || expenseCategories[1]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 145.80,
      description: 'Electricity Bill',
      date: new Date('2025-10-05'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Groceries')?.id || expenseCategories[2]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 125.45,
      description: 'Weekly Grocery Shopping',
      date: new Date('2025-10-07'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Dining Out')?.id || expenseCategories[3]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 45.50,
      description: 'Dinner at Restaurant',
      date: new Date('2025-10-12'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Transportation')?.id || expenseCategories[4]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 65.00,
      description: 'Gas Fill-up',
      date: new Date('2025-10-08'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Entertainment')?.id || expenseCategories[5]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 15.99,
      description: 'Netflix Subscription',
      date: new Date('2025-10-10'),
    },
    {
      userId: user.id,
      accountId: creditCard?.id || checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Shopping')?.id || expenseCategories[6]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 89.99,
      description: 'Clothing Purchase',
      date: new Date('2025-10-21'),
    },
    {
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: expenseCategories.find((c) => c.name === 'Healthcare')?.id || expenseCategories[7]?.id || expenseCategories[0].id,
      type: 'expense' as const,
      amount: 30.00,
      description: 'Doctor Co-pay',
      date: new Date('2025-10-11'),
    },
  ];

  // Calculate balance updates
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

  // Create transactions
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

  console.log(`✅ Created ${transactions.length} transactions for ${userEmail}`);
  
  const updatedAccounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  console.log('\n💰 Account Balances:');
  updatedAccounts.forEach(account => {
    console.log(`  ${account.name}: $${account.balance.toFixed(2)}`);
  });
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
