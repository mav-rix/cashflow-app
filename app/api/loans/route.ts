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
    
    // Get all loans for the user
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: [
        { isActive: 'desc' },
        { paymentDay: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        type: true,
        principal: true,
        currentBalance: true,
        interestRate: true,
        termMonths: true,
        monthlyPayment: true,
        paymentDay: true,
        lender: true,
        isActive: true,
        isPaidOff: true,
        isDisabled: true,
        color: true,
        startDate: true,
        endDate: true,
        paymentFrequency: true,
        numberOfPayments: true,
        feeAmount: true,
        allowSplitPayment: true,
        payments: {
          where: {
            dueDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: { dueDate: 'asc' },
          take: 3, // Next 3 payments
        },
        _count: {
          select: { payments: true },
        },
      },
    })
    
    // Calculate summary stats
    const totalDebt = loans
      .filter((loan: any) => loan.isActive)
      .reduce((sum: number, loan: any) => sum + loan.currentBalance, 0)
    
    const totalMonthlyPayment = loans
      .filter((loan: any) => loan.isActive)
      .reduce((sum: number, loan: any) => sum + loan.monthlyPayment, 0)
    
    return NextResponse.json({
      loans,
      summary: {
        totalDebt,
        totalMonthlyPayment,
        activeLoans: loans.filter((l: any) => l.isActive).length,
        totalLoans: loans.length,
      },
    })
  } catch (error: any) {
    console.error('Loans fetch error:', error)
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
    const loanId = searchParams.get('id')

    if (!loanId) {
      return NextResponse.json(
        { error: 'Loan ID required' },
        { status: 400 }
      )
    }

    // Verify loan belongs to user
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

    // Delete all associated payments first
    await prisma.loanPayment.deleteMany({
      where: { loanId },
    })

    // Delete the loan
    await prisma.loan.delete({
      where: { id: loanId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Loan deletion error:', error)
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
    const { id, name, principal, interestRate, termMonths, monthlyPayment, paymentDay, paymentFrequency, lender, color } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Loan ID required' },
        { status: 400 }
      )
    }

    // Verify loan belongs to user
    const loan = await prisma.loan.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Update the loan
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        name,
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
        monthlyPayment: parseFloat(monthlyPayment),
        paymentDay: parseInt(paymentDay),
        paymentFrequency: paymentFrequency || null,
        lender: lender || null,
        color: color || null,
      },
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error('Loan update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
