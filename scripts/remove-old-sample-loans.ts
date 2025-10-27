import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeOldSampleLoans() {
  console.log('Removing old sample loans...\n');

  // Your actual loans
  const actualLoans = [
    'Small Loan - Fundency',
    'Loan - Afterpay',
    'IRD Student Loan',
    'CommBank CC',
    'NAB CC',
    'Coles CC',
    'Small Loan - Fundency 2',
    'Small Loan - Fundo',
    'Small Loan - Wallet Wizard',
    'Afterpay BNPL',
  ];

  // Delete loans that are NOT in your actual list
  const allLoans = await prisma.loan.findMany({
    select: { id: true, name: true }
  });

  for (const loan of allLoans) {
    if (!actualLoans.includes(loan.name)) {
      await prisma.loan.delete({
        where: { id: loan.id }
      });
      console.log(`✓ Removed: ${loan.name}`);
    } else {
      console.log(`- Kept: ${loan.name}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
  const remainingLoans = await prisma.loan.count({ where: { isActive: true } });
  console.log(`Remaining loans: ${remainingLoans}`);
}

removeOldSampleLoans()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
