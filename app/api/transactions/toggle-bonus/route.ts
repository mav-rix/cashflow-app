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
    const { transactionId, includeBonusNext } = body
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    // Update the transaction
    const transaction = await prisma.transaction.update({
      where: { 
        id: transactionId,
        userId // Ensure user owns this transaction
      },
      data: {
        includeBonusNext
      },
    })
    
    return NextResponse.json({ 
      success: true,
      includeBonusNext: transaction.includeBonusNext 
    })
  } catch (error: any) {
    console.error('Toggle bonus error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle bonus' },
      { status: 500 }
    )
  }
}
