import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = sessionCookie.value;
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    // Get current loan
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Toggle isDisabled
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: { isDisabled: !loan.isDisabled },
    });

    return NextResponse.json({
      success: true,
      loan: updatedLoan,
      isDisabled: updatedLoan.isDisabled
    });
  } catch (error) {
    console.error('Error toggling loan disable:', error);
    return NextResponse.json(
      { error: 'Failed to toggle loan disable status' },
      { status: 500 }
    );
  }
}