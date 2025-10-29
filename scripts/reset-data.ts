import { prisma } from '../lib/prisma'

async function resetData() {
  try {
    console.log('Deleting all financial data...')
    
    // Delete in order to respect foreign key constraints
    await prisma.loanPayment.deleteMany({})
    console.log('✓ Deleted all loan payments')
    
    await prisma.loan.deleteMany({})
    console.log('✓ Deleted all loans')
    
    await prisma.transaction.deleteMany({})
    console.log('✓ Deleted all transactions')
    
    await prisma.budget.deleteMany({})
    console.log('✓ Deleted all budgets')
    
    await prisma.goal.deleteMany({})
    console.log('✓ Deleted all goals')
    
    await prisma.account.deleteMany({})
    console.log('✓ Deleted all accounts')
    
    await prisma.category.deleteMany({})
    console.log('✓ Deleted all categories')
    
    console.log('\n✅ All financial data deleted successfully!')
    console.log('👤 User account preserved')
    
  } catch (error) {
    console.error('Error resetting data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetData()
