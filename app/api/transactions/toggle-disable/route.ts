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
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get current transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Toggle isDisabled
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { isDisabled: !transaction.isDisabled },
    });

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      isDisabled: updatedTransaction.isDisabled
    });
  } catch (error) {
    console.error('Error toggling transaction disable:', error);
    return NextResponse.json(
      { error: 'Failed to toggle transaction disable status' },
      { status: 500 }
    );
  }
}