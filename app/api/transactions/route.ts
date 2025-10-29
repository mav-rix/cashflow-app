import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    
    // Get recent transactions (last 20)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        date: true,
        isDisabled: true,
        category: {
          select: { name: true, color: true, icon: true },
        },
        account: {
          select: { name: true },
        },
      },
    })
    
    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error('Transactions error:', error)
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
    
    const { amount, type, description, date, categoryId, accountId } = body
    
    if (!amount || !type || !categoryId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type,
        description: description || '',
        date: date ? new Date(date) : new Date(),
        categoryId,
        accountId,
      },
      include: {
        category: {
          select: { name: true, color: true, icon: true },
        },
        account: {
          select: { name: true },
        },
      },
    })

    // Update account balance
    await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: type === 'income' ? parseFloat(amount) : -parseFloat(amount),
        },
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Transaction creation error:', error)
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
    
    const { id, amount, type, description, date, categoryId, accountId } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    // Verify transaction belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(accountId && { accountId }),
      },
      include: {
        category: {
          select: { name: true, color: true, icon: true },
        },
        account: {
          select: { name: true },
        },
      },
    })

    // Update account balance if amount or accountId changed
    if (amount !== undefined || accountId) {
      const oldAmount = existingTransaction.amount
      const oldAccountId = existingTransaction.accountId
      const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount
      const newAccountId = accountId || oldAccountId

      // Revert old account balance
      await prisma.account.update({
        where: { id: oldAccountId },
        data: {
          balance: {
            increment: existingTransaction.type === 'income' ? -oldAmount : oldAmount,
          },
        },
      })

      // Apply new account balance
      await prisma.account.update({
        where: { id: newAccountId },
        data: {
          balance: {
            increment: transaction.type === 'income' ? newAmount : -newAmount,
          },
        },
      })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Transaction update error:', error)
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
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Revert account balance
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: {
          increment: transaction.type === 'income' ? -transaction.amount : transaction.amount,
        },
      },
    })

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
