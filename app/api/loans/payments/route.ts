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
    const { searchParams } = new URL(request.url)
    const loanId = searchParams.get('loanId')
    
    if (!loanId) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
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
    
    // Get all payments for this loan
    const payments = await prisma.loanPayment.findMany({
      where: { loanId },
      orderBy: { dueDate: 'asc' },
    })
    
    // Get upcoming payments (next 3 months)
    const now = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    
    const upcomingPayments = payments.filter(
      p => p.status === 'pending' && p.dueDate >= now && p.dueDate <= threeMonthsFromNow
    )
    
    // Get overdue payments
    const overduePayments = payments.filter(
      p => p.status === 'pending' && p.dueDate < now
    )
    
    return NextResponse.json({
      payments,
      upcomingPayments,
      overduePayments,
      totalPaid: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPending: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
    })
  } catch (error: any) {
    console.error('Payments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mark payment as paid
export async function PATCH(request: NextRequest) {
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
    const { paymentId, status, paymentDate, transactionId } = body
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }
    
    // Verify payment belongs to user's loan
    const payment = await prisma.loanPayment.findFirst({
      where: {
        id: paymentId,
        loan: {
          userId,
        },
      },
      include: {
        loan: true,
      },
    })
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    // Update payment status
    const updatedPayment = await prisma.loanPayment.update({
      where: { id: paymentId },
      data: {
        status: status || 'paid',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionId,
      },
    })
    
    // If marking as paid, update loan balance
    if (status === 'paid' && payment.principal) {
      await prisma.loan.update({
        where: { id: payment.loanId },
        data: {
          currentBalance: Math.max(0, payment.loan.currentBalance - payment.principal),
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Payment updated successfully',
    })
  } catch (error: any) {
    console.error('Payment update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
