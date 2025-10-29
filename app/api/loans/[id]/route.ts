import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: loanId } = await params

    // Get the loan with recent payments
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Get recent payments
    const recentPayments = await prisma.loanPayment.findMany({
      where: {
        loanId,
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 5,
    })

    return NextResponse.json({
      loan,
      recentPayments,
    })
  } catch (error: any) {
    console.error('Loan detail fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
