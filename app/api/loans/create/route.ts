import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { loanSchema } from '@/lib/validations'
import { calculateMonthlyPayment, generateAmortizationSchedule } from '@/lib/loan-utils'

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
    
    // Convert date string to Date object if needed
    if (typeof body.startDate === 'string') {
      body.startDate = new Date(body.startDate)
    }
    
    // Validate input
    const validatedData = loanSchema.parse(body)
    
    // Calculate end date based on term
    const endDate = new Date(validatedData.startDate)
    endDate.setMonth(endDate.getMonth() + validatedData.termMonths)
    
    // Create the loan
    const loan = await prisma.loan.create({
      data: {
        userId,
        name: validatedData.name,
        type: validatedData.type,
        principal: validatedData.principal,
        currentBalance: validatedData.currentBalance,
        interestRate: validatedData.interestRate,
        termMonths: validatedData.termMonths,
        startDate: validatedData.startDate,
        endDate,
        monthlyPayment: validatedData.monthlyPayment,
        paymentDay: validatedData.paymentDay,
        lender: validatedData.lender,
        accountNumber: validatedData.accountNumber,
        notes: validatedData.notes,
        color: validatedData.color,
        paymentFrequency: validatedData.paymentFrequency,
        numberOfPayments: validatedData.numberOfPayments,
        feeAmount: validatedData.feeAmount,
        allowSplitPayment: validatedData.allowSplitPayment || false,
      },
    })
    
    // Generate payment schedule based on loan type
    let paymentsToCreate: Array<{
      loanId: string
      dueDate: Date
      amount: number
      principal: number
      interest: number
      status: 'pending'
    }> = []
    
    if (validatedData.type === 'bnpl' && validatedData.numberOfPayments) {
      // BNPL: Split amount into equal installments
      const frequency = validatedData.paymentFrequency || 'biweekly'
      const numPayments = validatedData.numberOfPayments
      const installmentAmount = validatedData.currentBalance / numPayments
      
      // Calculate days between payments
      const daysMap: Record<string, number> = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
      }
      const daysBetween = daysMap[frequency] || 14
      
      for (let i = 0; i < numPayments; i++) {
        const dueDate = new Date(validatedData.startDate)
        dueDate.setDate(dueDate.getDate() + (daysBetween * i))
        
        paymentsToCreate.push({
          loanId: loan.id,
          dueDate,
          amount: installmentAmount,
          principal: installmentAmount,
          interest: 0, // BNPL typically has 0% interest
          status: 'pending',
        })
      }
    } else if (validatedData.type === 'payday') {
      // Payday loan: typically 2-4 weeks, full payment or split option
      const totalAmount = validatedData.currentBalance + (validatedData.feeAmount || 0)
      
      if (validatedData.allowSplitPayment) {
        // Split into 2 payments (common for payday loans)
        const halfAmount = totalAmount / 2
        const firstPayment = new Date(validatedData.startDate)
        firstPayment.setDate(firstPayment.getDate() + 14) // 2 weeks
        
        const secondPayment = new Date(validatedData.startDate)
        secondPayment.setDate(secondPayment.getDate() + 28) // 4 weeks
        
        paymentsToCreate.push({
          loanId: loan.id,
          dueDate: firstPayment,
          amount: halfAmount,
          principal: halfAmount,
          interest: 0,
          status: 'pending',
        })
        
        paymentsToCreate.push({
          loanId: loan.id,
          dueDate: secondPayment,
          amount: halfAmount,
          principal: halfAmount,
          interest: 0,
          status: 'pending',
        })
      } else {
        // Single payment (typical payday loan)
        const dueDate = new Date(validatedData.startDate)
        dueDate.setDate(dueDate.getDate() + (validatedData.termMonths * 30)) // Use term or default to 14 days
        
        paymentsToCreate.push({
          loanId: loan.id,
          dueDate,
          amount: totalAmount,
          principal: validatedData.currentBalance,
          interest: validatedData.feeAmount || 0,
          status: 'pending',
        })
      }
    } else {
      // Traditional loan: use amortization schedule
      const schedule = generateAmortizationSchedule(
        validatedData.currentBalance,
        validatedData.interestRate,
        validatedData.termMonths,
        validatedData.startDate,
        validatedData.paymentDay
      )
      
      // Create payment records for the next 12 months
      paymentsToCreate = schedule.slice(0, 12).map(item => ({
        loanId: loan.id,
        dueDate: item.dueDate,
        amount: item.payment,
        principal: item.principal,
        interest: item.interest,
        status: 'pending' as const,
      }))
    }
    
    // Create all payment records
    await prisma.loanPayment.createMany({
      data: paymentsToCreate,
    })
    
    return NextResponse.json({
      success: true,
      loan,
      message: 'Loan created successfully',
    })
  } catch (error: any) {
    console.error('Loan creation error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
