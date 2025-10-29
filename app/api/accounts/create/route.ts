import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

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
    
    const { name, type, balance, currency, description, color } = body
    
    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }
    
    // Create account
    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: parseFloat(balance || 0),
        currency: currency || 'USD',
        description: description || null,
        color: color || null,
        userId,
      },
    })
    
    return NextResponse.json({ account }, { status: 201 })
  } catch (error: any) {
    console.error('Create account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
