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
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currency: true,
        dateFormat: true,
        locale: true,
        statsPeriod: true,
        name: true,
        email: true,
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      preferences: {
        currency: user.currency,
        dateFormat: user.dateFormat,
        locale: user.locale,
        statsPeriod: user.statsPeriod,
      },
      user: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
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
    
    const { currency, dateFormat, locale, statsPeriod } = body
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currency: currency || 'USD',
        dateFormat: dateFormat || 'MM/DD/YYYY',
        locale: locale || 'en-US',
        statsPeriod: statsPeriod || 'monthly',
      },
      select: {
        currency: true,
        dateFormat: true,
        locale: true,
        statsPeriod: true,
      },
    })
    
    return NextResponse.json({
      success: true,
      preferences: updatedUser,
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
