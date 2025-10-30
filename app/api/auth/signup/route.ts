import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { signUpAPISchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input (using API schema without confirmPassword)
    const validatedData = signUpAPISchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

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

    // Create user and categories in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })

      // Create default categories for the new user
      await tx.category.createMany({
        data: defaultCategories.map(category => ({
          ...category,
          userId: newUser.id,
        })),
      })

      return newUser
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    // Return more detailed error for debugging
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
