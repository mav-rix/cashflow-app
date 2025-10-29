import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExtraData() {
  console.log('Cleaning up extra data...\n');

  // Your original transactions before the script
  const originalTransactions = [
    'Utilities - Elec, Gas, Water',
    'Rent - Weekly',
    'Health - Preventer',
    'Mobile - Optus',
    'Internet - Superloop',
    'Super Retail Group' // Your income
  ];

  // Delete transactions that are NOT in the original list
  const allTransactions = await prisma.transaction.findMany({
    select: { id: true, description: true }
  });

  for (const txn of allTransactions) {
    if (txn.description && !originalTransactions.includes(txn.description)) {
      await prisma.transaction.delete({
        where: { id: txn.id }
      });
      console.log(`✓ Removed: ${txn.description}`);
    } else {
      console.log(`- Kept: ${txn.description || 'null'}`);
    }
  }

  // Delete all loans (you didn't have any before)
  const deletedLoans = await prisma.loan.deleteMany({});
  console.log(`\n✓ Removed ${deletedLoans.count} loans`);

  console.log('\n✅ Cleanup complete!');
  console.log('\nRemaining data:');
  const remainingTransactions = await prisma.transaction.count();
  const remainingLoans = await prisma.loan.count();
  console.log(`  Transactions: ${remainingTransactions}`);
  console.log(`  Loans: ${remainingLoans}`);
}

cleanupExtraData()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
