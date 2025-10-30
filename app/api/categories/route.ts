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

    // Get categories for the current user
    const categories = await prisma.category.findMany({
      where: {
        userId: userId
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
