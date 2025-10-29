'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ImportPage() {
  const [pastedData, setPastedData] = useState('')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const data = e.clipboardData.getData('text')
    setPastedData(data)
  }

  const handleImport = async () => {
    if (!pastedData) {
      setMessage('No data to import')
      return
    }

    setImporting(true)
    setMessage('')

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: pastedData
        }),
      })

      const result = await res.json()

      if (res.ok) {
        let msg = `✅ ${result.message}`
        
        // Add errors info
        if (result.errors && result.errors.length > 0) {
          msg += `\n\n⚠️ Warnings:\n${result.errors.join('\n')}`
        }
        
        // Highlight duplicates if any
        if (result.duplicateCount > 0) {
          msg += `\n\n📋 Note: ${result.duplicateCount} duplicate${result.duplicateCount > 1 ? 's' : ''} skipped (already in database)`
        }
        
        setMessage(msg)
        setPastedData('')
        
        // Redirect after 3 seconds (increased to allow reading the message)
        setTimeout(() => {
          window.location.href = '/transactions'
        }, 3000)
      } else {
        setMessage(`❌ Import failed: ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    }

    setImporting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/transactions">
              <Button variant="outline" size="sm">
                ← Back to Transactions
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Import Financial Data</h1>
          <p className="mt-2 text-gray-600">
            Paste your financial data from Excel or Google Sheets. The system will automatically detect and categorize income, expenses, and loans.
          </p>
        </div>

        {/* Import Area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paste Your Data</h2>
          
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste your data here from Excel or Google Sheets...

Example format:
Super Retail Group	$1,563.65	$272.00	$1,563.65	No	

Fixed Costs	Detailed Category	Total Amount	Amount Due	Due Date	To Pay Next
Rent	Rent	$600.00	$720.00	Weekly	FALSE

Loans & Debt	Detailed Category	Total Amount	Amount Due	Due Date	To Pay Next
IRD 	Student Loan	$44,715.80	$192.00	Weekly	FALSE
            "
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
            rows={15}
          />

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Important: Required Format</h3>
            <div className="text-sm text-blue-900 space-y-3">
              <div>
                <p className="font-medium mb-1">✅ Correct Format (Tab-separated from Excel/Google Sheets):</p>
                <ul className="ml-4 space-y-1 text-blue-800">
                  <li>• Must include section headers: <span className="font-mono bg-white px-1 rounded">Income Source</span>, <span className="font-mono bg-white px-1 rounded">Fixed Costs</span>, <span className="font-mono bg-white px-1 rounded">Loans & Debt</span>, or <span className="font-mono bg-white px-1 rounded">Discretionary</span></li>
                  <li>• Each section should be on its own line</li>
                  <li>• Data rows should have columns separated by TABS (copy directly from Excel/Sheets)</li>
                  <li>• Include column headers like: Detailed Category, Total Amount, Amount Due, Due Date</li>
                </ul>
              </div>
              
              <div className="border-t border-blue-300 pt-3">
                <p className="font-medium mb-1">💡 How it works:</p>
                <ul className="ml-4 space-y-1 text-blue-800">
                  <li>• <span className="font-semibold">Income Source</span> section → Creates income transactions</li>
                  <li>• <span className="font-semibold">Loans & Debt</span> section → Creates loan entries</li>
                  <li>• <span className="font-semibold">Other sections</span> → Creates expense transactions</li>
                  <li>• Categories are auto-matched by description (Rent, Utilities, etc.)</li>
                  <li>• Duplicate detection prevents re-importing the same data</li>
                </ul>
              </div>
              
              <div className="border-t border-blue-300 pt-3">
                <p className="font-medium mb-1">💰 Bonus/Variable Income:</p>
                <ul className="ml-4 space-y-1 text-blue-800">
                  <li>• If you have two amounts for income (e.g., base salary + bonus), include both columns</li>
                  <li>• First amount = base, Second amount = bonus (can toggle on/off later)</li>
                  <li>• Example: <span className="font-mono bg-white px-1 rounded text-xs">Super Retail Group  $1,563.65  $272.00</span></li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                <p className="font-semibold text-amber-900">⚠️ Common Issues:</p>
                <ul className="ml-4 mt-1 space-y-1 text-amber-800 text-xs">
                  <li>• Don't type data manually - copy/paste from Excel/Google Sheets to preserve tabs</li>
                  <li>• Ensure section headers are exactly: "Income Source", "Fixed Costs", "Loans & Debt", "Discretionary"</li>
                  <li>• If import isn't working, check that columns are tab-separated (not spaces)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="whitespace-pre-line font-medium">{message}</div>
          </div>
        )}

        {/* Import Button */}
        {pastedData && (
          <div className="flex justify-end gap-4">
            <Link href="/transactions">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing . . .' : 'Import Data'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
