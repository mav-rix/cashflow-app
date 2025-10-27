import { prisma } from '../lib/prisma'

async function main() {
  // Create default categories
  const defaultCategories = [
    // Expense categories
    { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍔', isDefault: true },
    { name: 'Shopping', type: 'expense', color: '#f97316', icon: '🛍️', isDefault: true },
    { name: 'Transportation', type: 'expense', color: '#eab308', icon: '🚗', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#84cc16', icon: '🎬', isDefault: true },
    { name: 'Bills & Utilities', type: 'expense', color: '#06b6d4', icon: '📄', isDefault: true },
    { name: 'Healthcare', type: 'expense', color: '#3b82f6', icon: '⚕️', isDefault: true },
    { name: 'Education', type: 'expense', color: '#8b5cf6', icon: '📚', isDefault: true },
    { name: 'Housing', type: 'expense', color: '#d946ef', icon: '🏠', isDefault: true },
    { name: 'Insurance', type: 'expense', color: '#ec4899', icon: '🛡️', isDefault: true },
    { name: 'Subscriptions', type: 'expense', color: '#64748b', icon: '📱', isDefault: true },
    { name: 'Other', type: 'expense', color: '#94a3b8', icon: '📦', isDefault: true },
    
    // Income categories
    { name: 'Salary', type: 'income', color: '#10b981', icon: '💼', isDefault: true },
    { name: 'Freelance', type: 'income', color: '#14b8a6', icon: '💻', isDefault: true },
    { name: 'Investment', type: 'income', color: '#06b6d4', icon: '📈', isDefault: true },
    { name: 'Gift', type: 'income', color: '#8b5cf6', icon: '🎁', isDefault: true },
    { name: 'Other Income', type: 'income', color: '#6366f1', icon: '💰', isDefault: true },
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    })
  }

  console.log('✅ Default categories seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
