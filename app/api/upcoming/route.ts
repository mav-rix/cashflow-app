import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = sessionCookie.value;
    
    // Get all recurring transactions (both recurring flag and those with recurrence set)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isDisabled: false,
        OR: [
          { isRecurring: true },
          { recurrence: { not: null } }
        ]
      },
      select: {
        id: true,
        description: true,
        amount: true,
        bonusAmount: true,
        includeBonusNext: true,
        type: true,
        date: true,
        recurrence: true,
      },
    });

    // Get all active loans
    const loans = await prisma.loan.findMany({
      where: {
        userId,
        isActive: true,
        isPaidOff: false,
        isDisabled: false,
      },
      select: {
        id: true,
        name: true,
        monthlyPayment: true,
        paymentFrequency: true,
        paymentDay: true,
        lender: true,
        currentBalance: true,
      },
    });

    // console.log('Upcoming API - Found transactions:', transactions.length);
    // console.log('Upcoming API - Found loans:', loans.length);

    // Helper function to calculate next due date based on recurrence
    const getNextDueDate = (lastDate: Date, recurrence: string): Date => {
      const next = new Date(lastDate);
      switch (recurrence) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'biweekly':
          next.setDate(next.getDate() + 14);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
      return next;
    };

    // Helper function to get next payment date for a loan
    const getNextLoanPaymentDate = (paymentDay: number, frequency: string | null): Date => {
      const today = new Date();
      const current = new Date(today);
      
      if (frequency === 'weekly') {
        // paymentDay is day of week (0-6, where 0=Sunday)
        const daysUntilPayment = (paymentDay - current.getDay() + 7) % 7;
        current.setDate(current.getDate() + (daysUntilPayment || 7));
      } else if (frequency === 'biweekly') {
        // paymentDay is day of week (0-6, where 0=Sunday)
        // For biweekly, we need to find the next occurrence of this day
        const daysUntilPayment = (paymentDay - current.getDay() + 7) % 7;
        current.setDate(current.getDate() + (daysUntilPayment || 7));
      } else {
        // Monthly - paymentDay is day of month (1-31)
        current.setDate(paymentDay);
        if (current <= today) {
          current.setMonth(current.getMonth() + 1);
        }
      }
      
      return current;
    };

    // Combine and transform into a unified format
    const upcomingItems = [
      ...transactions.map((t: typeof transactions[0]) => {
        const baseAmount = t.amount || 0;
        const bonus = (t.bonusAmount && t.includeBonusNext) ? t.bonusAmount : 0;
        const totalAmount = t.type === 'income' ? baseAmount + bonus : baseAmount;
        const nextDue = t.recurrence ? getNextDueDate(new Date(t.date), t.recurrence) : new Date(t.date);
        
        return {
          id: `txn-${t.id}`,
          type: t.type as 'income' | 'expense',
          name: t.description,
          amount: totalAmount,
          hasBonus: t.bonusAmount !== null && t.bonusAmount > 0,
          bonusIncluded: t.includeBonusNext || false,
          baseAmount: t.type === 'income' && t.bonusAmount ? baseAmount : undefined,
          bonusAmount: t.type === 'income' && t.bonusAmount ? t.bonusAmount : undefined,
          dueDate: nextDue,
          frequency: t.recurrence,
          source: 'transaction' as const,
        };
      }),
      ...loans.map((l: typeof loans[0]) => ({
        id: `loan-${l.id}`,
        type: 'loan' as const,
        name: l.name,
        lender: l.lender,
        amount: l.monthlyPayment,
        balance: l.currentBalance,
        dueDate: getNextLoanPaymentDate(l.paymentDay, l.paymentFrequency),
        frequency: l.paymentFrequency,
        source: 'loan' as const,
      })),
    ];

    // Sort by due date (earliest first)
    upcomingItems.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });

    return NextResponse.json({ items: upcomingItems });
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming payments' },
      { status: 500 }
    );
  }
}
