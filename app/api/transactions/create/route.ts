import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
    
    const { amount, type, description, date, accountId, categoryId, isRecurring, recurrence, bonusAmount, includeBonusNext, notes } = body
    
    // Validate required fields
    if (!amount || !type || !accountId) {
      return NextResponse.json(
        { error: 'Amount, type, and account are required' },
        { status: 400 }
      )
    }
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        accountId,
        categoryId: categoryId || null,
        isRecurring: isRecurring || false,
        recurrence: recurrence || null,
        bonusAmount: bonusAmount && parseFloat(bonusAmount) > 0 ? parseFloat(bonusAmount) : null,
        includeBonusNext: includeBonusNext || false,
        notes: notes || null,
        userId,
      },
      include: {
        category: true,
        account: true,
      },
    })
    
    // Update account balance
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    })
    
    if (account) {
      const newBalance = type === 'income' 
        ? account.balance + parseFloat(amount)
        : account.balance - parseFloat(amount)
        
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      })
    }
    
    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error: any) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
