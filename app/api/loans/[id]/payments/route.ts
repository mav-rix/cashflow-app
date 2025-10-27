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

    // Verify loan belongs to user
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        monthlyPayment: true,
      },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Get all payments for the loan
    const payments = await prisma.loanPayment.findMany({
      where: {
        loanId,
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    // Categorize payments by status
    const now = new Date()
    const categorizedPayments = payments.map((payment: any) => {
      let status = payment.status
      
      // Update status based on dates
      if (payment.paidDate) {
        status = 'paid'
      } else if (new Date(payment.dueDate) < now) {
        status = 'overdue'
      } else {
        status = 'pending'
      }

      return {
        ...payment,
        status,
      }
    })

    return NextResponse.json({
      loan,
      payments: categorizedPayments,
    })
  } catch (error: any) {
    console.error('Payment history fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
