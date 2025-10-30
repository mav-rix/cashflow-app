import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get user from session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = sessionCookie.value

    // Define default categories
    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'income', color: '#10b981', icon: '💰' },
      { name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💼' },
      { name: 'Investment', type: 'income', color: '#8b5cf6', icon: '📈' },
      { name: 'Other Income', type: 'income', color: '#06b6d4', icon: '💵' },

      // Expense categories
      { name: 'Groceries', type: 'expense', color: '#f59e0b', icon: '🛒' },
      { name: 'Rent', type: 'expense', color: '#ef4444', icon: '🏠' },
      { name: 'Utilities', type: 'expense', color: '#06b6d4', icon: '💡' },
      { name: 'Transportation', type: 'expense', color: '#8b5cf6', icon: '🚗' },
      { name: 'Healthcare', type: 'expense', color: '#ec4899', icon: '⚕️' },
      { name: 'Entertainment', type: 'expense', color: '#f59e0b', icon: '🎬' },
      { name: 'Dining Out', type: 'expense', color: '#ef4444', icon: '🍽️' },
      { name: 'Shopping', type: 'expense', color: '#3b82f6', icon: '🛍️' },
      { name: 'Education', type: 'expense', color: '#10b981', icon: '📚' },
      { name: 'Other Expense', type: 'expense', color: '#6b7280', icon: '📝' },
    ]

    // Check if user already has categories
    const existingCategories = await prisma.category.findMany({
      where: { userId }
    })

    if (existingCategories.length > 0) {
      return NextResponse.json(
        { message: 'Categories already exist', count: existingCategories.length },
        { status: 200 }
      )
    }

    // Create default categories
    await prisma.category.createMany({
      data: defaultCategories.map(category => ({
        ...category,
        userId,
      })),
    })

    return NextResponse.json(
      { message: 'Categories seeded successfully', count: defaultCategories.length },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Category seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
