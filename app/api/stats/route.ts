import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    
    // Get period from query params (weekly, biweekly, monthly)
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    
    // Get current date info based on period
    const now = new Date()
    let firstDay: Date
    let lastDay: Date
    
    if (period === 'weekly') {
      // Get start of current week (Sunday)
      const dayOfWeek = now.getDay()
      firstDay = new Date(now)
      firstDay.setDate(now.getDate() - dayOfWeek)
      firstDay.setHours(0, 0, 0, 0)
      
      lastDay = new Date(firstDay)
      lastDay.setDate(firstDay.getDate() + 6)
      lastDay.setHours(23, 59, 59, 999)
    } else if (period === 'biweekly') {
      // Get past 14 days
      firstDay = new Date(now)
      firstDay.setDate(now.getDate() - 13)
      firstDay.setHours(0, 0, 0, 0)
      
      lastDay = new Date(now)
      lastDay.setHours(23, 59, 59, 999)
    } else {
      // Monthly (default)
      firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      firstDay.setHours(0, 0, 0, 0)
      lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      lastDay.setHours(23, 59, 59, 999)
    }
    
    // Get all accounts for total balance
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: { balance: true, type: true },
    })
    
    // Calculate total balance (excluding credit cards as they're liabilities)
    const totalBalance = accounts.reduce((sum: number, acc: { balance: number, type: string }) => {
      // For credit cards, negative balance means you owe money
      if (acc.type === 'credit_card') {
        return sum - Math.abs(acc.balance)
      }
      return sum + acc.balance
    }, 0)
    
    // Get all transactions for the current period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isDisabled: false,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      select: { 
        amount: true,
        type: true,
      },
    })
    
    // Calculate monthly income and expenses
    let monthlyIncome = 0
    let monthlyExpenses = 0
    
    transactions.forEach((t: { amount: number, type: string }) => {
      if (t.type === 'income') {
        monthlyIncome += Math.abs(t.amount)
      } else if (t.type === 'expense') {
        monthlyExpenses += Math.abs(t.amount)
      }
    })
    
    // Get active loans and calculate payments for the period
    const loans = await prisma.loan.findMany({
      where: {
        userId,
        isActive: true,
        isPaidOff: false,
        isDisabled: false,
      },
      select: {
        monthlyPayment: true,
        paymentFrequency: true,
      },
    })
    
    // Calculate total loan payments for the period
    let loanPayments = 0
    loans.forEach((loan: { monthlyPayment: number, paymentFrequency: string | null }) => {
      const frequency = loan.paymentFrequency || 'monthly'
      const payment = loan.monthlyPayment
      
      if (period === 'weekly') {
        // Calculate weekly payment
        if (frequency === 'weekly') {
          loanPayments += payment
        } else if (frequency === 'biweekly') {
          loanPayments += payment / 2
        } else {
          loanPayments += payment / 4.33 // monthly to weekly
        }
      } else if (period === 'biweekly') {
        // Calculate fortnightly payment
        if (frequency === 'weekly') {
          loanPayments += payment * 2
        } else if (frequency === 'biweekly') {
          loanPayments += payment
        } else {
          loanPayments += payment / 2.17 // monthly to fortnightly
        }
      } else {
        // Monthly
        if (frequency === 'weekly') {
          loanPayments += payment * 4.33
        } else if (frequency === 'biweekly') {
          loanPayments += payment * 2.17
        } else {
          loanPayments += payment
        }
      }
    })
    
    // Add loan payments to expenses
    monthlyExpenses += loanPayments
    
    // Get accounts count
    const accountsCount = accounts.length
    
    // Calculate net income
    const netIncome = monthlyIncome - monthlyExpenses
    
    // Debug logging
    console.log('Stats calculation:', {
      period,
      firstDay: firstDay.toISOString(),
      lastDay: lastDay.toISOString(),
      transactionsCount: transactions.length,
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      totalBalance,
      accountsCount,
    })
    
    return NextResponse.json({
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: Number(monthlyIncome.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      accountsCount,
      netIncome: Number(netIncome.toFixed(2)),
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
