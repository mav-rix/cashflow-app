import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = sessionCookie.value
    
    // Get current date info
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    lastDayOfMonth.setHours(23, 59, 59, 999)
    
    // Get all budgets with their categories
    const budgets = await prisma.budget.findMany({
      where: { 
        userId,
      },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'expense',
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
          },
          select: {
            amount: true,
          },
        })
        
        const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        return {
          id: budget.id,
          name: budget.name,
          amount: budget.amount,
          spent,
          period: budget.period,
          category: budget.category,
        }
      })
    )
    
    return NextResponse.json({
      budgets: budgetsWithSpent,
    })
  } catch (error) {
    console.error('Budgets fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = sessionCookie.value
    const body = await request.json()
    
    const { name, categoryId, amount, period, alertAt } = body
    
    // Validate required fields
    if (!name || !categoryId || !amount || !period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Set start date to beginning of current month
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.setHours(0, 0, 0, 0)

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        userId,
        name,
        categoryId,
        amount: parseFloat(amount),
        period,
        startDate,
        alertAt: alertAt ? parseFloat(alertAt) : null,
      },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Budget creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = sessionCookie.value
    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('id')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID required' },
        { status: 400 }
      )
    }

    // Verify budget belongs to user before deleting
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = sessionCookie.value
    const body = await request.json()
    const { id, amount, period, alertAt } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID required' },
        { status: 400 }
      )
    }

    // Verify budget belongs to user
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Update the budget
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        period,
        alertAt: alertAt ? parseFloat(alertAt) : null,
      },
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    console.error('Budget update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
