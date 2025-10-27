import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseImportData, importFinancialData } from '@/lib/import-helper'

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
    const { data } = body

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }

    // Parse the raw data
    const parsedRows = await parseImportData(data)
    
    // Import the data
    const results = await importFinancialData(userId, parsedRows)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Imported ${results.incomeCount} income, ${results.expenseCount} expenses, ${results.loanCount} loans${results.duplicateCount > 0 ? `, ${results.duplicateCount} duplicates skipped` : ''}`
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}
