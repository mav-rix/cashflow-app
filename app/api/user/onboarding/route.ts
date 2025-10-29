import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    // Update user's onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Get user's onboarding status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true }
    })

    return NextResponse.json({ onboardingCompleted: user?.onboardingCompleted ?? false })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
