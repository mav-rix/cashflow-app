import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get the user
  const user = await prisma.user.findFirst()
  
  if (!user) {
    console.error('❌ No user found. Please create a user first.')
    return
  }

  console.log('👤 User found:', user.email)

  // Get or create account
  let account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'AUD',
        color: '#3b82f6',
        isActive: true,
      }
    })
    console.log('✅ Created account:', account.name)
  } else {
    console.log('📊 Using account:', account.name)
  }

  // Get categories
  const categories = await prisma.category.findMany({
    where: { userId: user.id }
  })

  console.log(`📋 Found ${categories.length} categories`)

  // Helper to find category
  const findCategory = (name: string, type: 'income' | 'expense') => {
    const cat = categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase() && c.type === type
    )
    if (cat) return cat
    
    // Fallback to first category of type
    return categories.find(c => c.type === type)
  }

  // Sample data from user
  const sampleData = [
    { description: 'Rent', details: 'Rent', amount: 600.00, payment: 720.00, frequency: 'Weekly', isLoan: false },
    { description: 'Small Loan', details: 'Fundency', amount: 2500.00, payment: 248.28, frequency: 'Fortnightly', isLoan: true },
    { description: 'Loan', details: 'Afterpay', amount: 170.00, payment: 50.00, frequency: 'Fortnightly', isLoan: true },
    { description: 'Utilities', details: 'Elec, Gas, Water', amount: 400.00, payment: 15.00, frequency: 'Weekly', isLoan: false },
  ]

  console.log('\n📥 Importing data...\n')

  for (const item of sampleData) {
    if (item.isLoan) {
      // Import as loan
      console.log(`💳 Creating loan: ${item.description} (${item.details})`)
      console.log(`   Principal: $${item.amount}, Monthly Payment: $${item.payment}`)
      
      try {
        const loan = await prisma.loan.create({
          data: {
            userId: user.id,
            name: `${item.description} - ${item.details}`,
            type: 'personal',
            principal: item.amount,
            currentBalance: item.amount,
            interestRate: 0, // User can edit later
            termMonths: 12, // Default 12 months
            startDate: new Date(),
            monthlyPayment: item.payment,
            paymentDay: 1,
            lender: item.details,
            accountNumber: '',
            notes: `Imported from spreadsheet. Frequency: ${item.frequency}`,
            color: '#9333EA',
            paymentFrequency: item.frequency.toLowerCase() === 'weekly' ? 'weekly' : 
                            item.frequency.toLowerCase() === 'fortnightly' ? 'biweekly' : 'monthly',
            numberOfPayments: 12,
            feeAmount: 0,
            allowSplitPayment: false,
          }
        })
        console.log(`   ✅ Loan created: ${loan.name}`)
      } catch (error: any) {
        console.error(`   ❌ Failed to create loan:`, error.message)
      }
    } else {
      // Import as transaction (expense)
      console.log(`💰 Creating expense: ${item.description}`)
      console.log(`   Amount: $${item.payment}, Frequency: ${item.frequency}`)
      
      const category = findCategory(item.description, 'expense')
      if (!category) {
        console.error(`   ❌ No category found for ${item.description}`)
        continue
      }
      
      try {
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            accountId: account.id,
            categoryId: category.id,
            amount: item.payment, // Use the payment amount (recurring payment)
            type: 'expense',
            description: `${item.description} - ${item.details}`,
            date: new Date(),
          }
        })
        
        // Update account balance
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: { decrement: item.payment } }
        })
        
        console.log(`   ✅ Transaction created: ${transaction.description} (Category: ${category.name})`)
      } catch (error: any) {
        console.error(`   ❌ Failed to create transaction:`, error.message)
      }
    }
  }

  console.log('\n✨ Import complete!')
  
  // Show summary
  const transactionCount = await prisma.transaction.count({ where: { userId: user.id } })
  const loanCount = await prisma.loan.count({ where: { userId: user.id } })
  
  console.log(`\n📊 Summary:`)
  console.log(`   Transactions: ${transactionCount}`)
  console.log(`   Loans: ${loanCount}`)
  console.log(`   Account Balance: $${account.balance}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
