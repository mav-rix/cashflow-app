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

  // Define default categories
  const categories = [
    // Income categories
    { name: 'Salary', type: 'income', color: '#10b981', icon: '💰', userId: user.id },
    { name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💼', userId: user.id },
    { name: 'Investment', type: 'income', color: '#8b5cf6', icon: '📈', userId: user.id },
    { name: 'Other Income', type: 'income', color: '#06b6d4', icon: '💵', userId: user.id },
    
    // Expense categories
    { name: 'Groceries', type: 'expense', color: '#f59e0b', icon: '🛒', userId: user.id },
    { name: 'Rent', type: 'expense', color: '#ef4444', icon: '🏠', userId: user.id },
    { name: 'Utilities', type: 'expense', color: '#6366f1', icon: '⚡', userId: user.id },
    { name: 'Transport', type: 'expense', color: '#14b8a6', icon: '🚗', userId: user.id },
    { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: '🎬', userId: user.id },
    { name: 'Healthcare', type: 'expense', color: '#f43f5e', icon: '🏥', userId: user.id },
    { name: 'Education', type: 'expense', color: '#8b5cf6', icon: '📚', userId: user.id },
    { name: 'Shopping', type: 'expense', color: '#f97316', icon: '🛍️', userId: user.id },
    { name: 'Subscriptions', type: 'expense', color: '#06b6d4', icon: '📱', userId: user.id },
    { name: 'Other Expense', type: 'expense', color: '#6b7280', icon: '📝', userId: user.id },
  ]

  // Create categories
  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        userId: user.id,
      },
    })

    if (existing) {
      console.log(`⏭️  Category "${category.name}" already exists`)
    } else {
      await prisma.category.create({ data: category })
      console.log(`✅ Created category: ${category.name}`)
    }
  }

  console.log('\n✨ Categories seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
