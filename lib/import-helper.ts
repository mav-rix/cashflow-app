import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ImportRow {
  description: string
  details?: string
  totalAmount?: number
  paymentAmount?: number
  frequency?: string
  dueDate?: string
  section?: string
}

// Helper function to parse various date formats
function parseDueDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  // Try parsing common date formats
  // Format: dd/mm/yyyy or dd-mm-yyyy
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10)
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1 // JS months are 0-indexed
    const year = parseInt(ddmmyyyyMatch[3], 10)
    const fullYear = year < 100 ? 2000 + year : year
    return new Date(fullYear, month, day)
  }
  
  // Format: "November 5" or "November 5, 2024"
  const monthNameMatch = dateStr.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(,?\s+(\d{4}))?$/i)
  if (monthNameMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const month = monthNames.indexOf(monthNameMatch[1].toLowerCase())
    const day = parseInt(monthNameMatch[2], 10)
    const year = monthNameMatch[4] ? parseInt(monthNameMatch[4], 10) : new Date().getFullYear()
    return new Date(year, month, day)
  }
  
  // Try standard Date parsing as fallback
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  return null
}

export async function importFinancialData(userId: string, data: ImportRow[]) {
  // Get or create account
  let account = await prisma.account.findFirst({
    where: { userId }
  })

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'AUD',
        color: '#3b82f6',
        isActive: true,
      }
    })
  }

  // Get categories
  const categories = await prisma.category.findMany({
    where: { userId }
  })

  // Helper to find category
  const findCategory = (name: string, type: 'income' | 'expense') => {
    const cat = categories.find((c: { name: string; type: string }) => 
      c.name.toLowerCase() === name.toLowerCase() && c.type === type
    )
    if (cat) return cat
    
    // Try partial match
    const partialMatch = categories.find((c: { name: string; type: string }) => 
      c.type === type && (
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(c.name.toLowerCase())
      )
    )
    if (partialMatch) return partialMatch
    
    // Fallback to first category of type
    return categories.find((c: { type: string }) => c.type === type)
  }

  const results = {
    incomeCount: 0,
    expenseCount: 0,
    loanCount: 0,
    duplicateCount: 0,
    errors: [] as string[]
  }

  // Get existing loans and transactions for duplicate detection
  const existingLoans = await prisma.loan.findMany({
    where: { userId },
    select: { name: true, principal: true, lender: true }
  })

  const existingTransactions = await prisma.transaction.findMany({
    where: { userId },
    select: { description: true, amount: true, type: true }
  })

  for (const row of data) {
    try {
      const descLower = row.description.toLowerCase()
      const sectionLower = row.section?.toLowerCase() || ''
      const amount = row.paymentAmount || row.totalAmount || 0

      // Determine if this is income, expense, or loan
      const isIncome = sectionLower.includes('income source')
      const isLoan = sectionLower.includes('loans & debt') ||
                     descLower.includes('loan') ||
                     descLower.includes('credit card') ||
                     descLower.includes('bnpl') ||
                     descLower.includes('afterpay') ||
                     descLower.includes('laybuy') ||
                     descLower.includes('zip') ||
                     descLower.includes('klarna')

      if (isLoan) {
        // Create loan
        const principal = row.totalAmount || amount
        const payment = row.paymentAmount || amount
        const loanName = row.details ? `${row.description} - ${row.details}` : row.description
        const lender = row.details || 'Unknown'
        
        // Check for duplicate loan
        const isDuplicate = existingLoans.some((loan: { name: string; principal: number; lender: string | null }) => 
          loan.name.toLowerCase() === loanName.toLowerCase() &&
          Math.abs(loan.principal - principal) < 0.01 &&
          loan.lender?.toLowerCase() === lender.toLowerCase()
        )
        
        if (isDuplicate) {
          results.duplicateCount++
          continue
        }
        
        let paymentFrequency: 'weekly' | 'biweekly' | 'monthly' = 'monthly'
        if (row.frequency?.toLowerCase().includes('week') && !row.frequency?.toLowerCase().includes('fort')) {
          paymentFrequency = 'weekly'
        } else if (row.frequency?.toLowerCase().includes('fort') || row.frequency?.toLowerCase().includes('biweek')) {
          paymentFrequency = 'biweekly'
        }

        // Parse due date if available
        let paymentDay = 1
        let startDate = new Date()
        
        if (row.dueDate) {
          const parsedDate = parseDueDate(row.dueDate)
          if (parsedDate) {
            paymentDay = parsedDate.getDate()
            startDate = parsedDate
          }
        }

        // Determine loan type
        let loanType: 'personal' | 'student' | 'creditCard' | 'mortgage' | 'auto' | 'other' = 'personal'
        if (descLower.includes('student')) loanType = 'student'
        else if (descLower.includes('credit card')) loanType = 'creditCard'
        else if (descLower.includes('mortgage') || descLower.includes('home')) loanType = 'mortgage'
        else if (descLower.includes('car') || descLower.includes('auto')) loanType = 'auto'

        await prisma.loan.create({
          data: {
            userId,
            name: loanName,
            type: loanType,
            principal,
            currentBalance: principal,
            interestRate: 0,
            termMonths: 12,
            startDate,
            monthlyPayment: payment,
            paymentDay,
            lender: row.details || 'Unknown',
            accountNumber: '',
            notes: row.frequency ? `${row.frequency} payments` : '',
            color: '#9333EA',
            paymentFrequency,
            numberOfPayments: 12,
            feeAmount: 0,
            allowSplitPayment: false,
          }
        })
        
        // Add to existing loans for duplicate detection within this batch
        existingLoans.push({
          name: loanName,
          principal,
          lender: row.details || 'Unknown'
        })
        
        results.loanCount++
      } else if (isIncome) {
        // Create income transaction
        const transactionDesc = row.details ? `${row.description} - ${row.details}` : row.description
        
        // For income with both totalAmount and paymentAmount, treat paymentAmount as bonus
        const baseAmount = row.totalAmount && row.paymentAmount && row.totalAmount !== row.paymentAmount
          ? row.totalAmount
          : amount
        const bonusAmount = row.totalAmount && row.paymentAmount && row.totalAmount !== row.paymentAmount
          ? row.paymentAmount
          : null
        
        // Check for duplicate transaction
        const isDuplicate = existingTransactions.some((txn: { description: string | null; amount: number; type: string }) => 
          txn.description?.toLowerCase() === transactionDesc.toLowerCase() &&
          Math.abs(txn.amount - baseAmount) < 0.01 &&
          txn.type === 'income'
        )
        
        if (isDuplicate) {
          results.duplicateCount++
          continue
        }
        
        const category = findCategory('Salary', 'income') || findCategory('Other Income', 'income')
        if (!category) {
          results.errors.push(`No income category found for: ${row.description}`)
          continue
        }

        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId: category.id,
            amount: baseAmount,
            type: 'income',
            description: transactionDesc,
            date: new Date(),
            bonusAmount: bonusAmount,
            includeBonusNext: false,
          }
        })
        
        // Add to existing transactions for duplicate detection within this batch
        existingTransactions.push({
          description: transactionDesc,
          amount: baseAmount,
          type: 'income'
        })
        
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: baseAmount } }
        })
        results.incomeCount++
      } else {
        // Create expense transaction
        const transactionDesc = row.details ? `${row.description} - ${row.details}` : row.description
        
        // Check for duplicate transaction
        const isDuplicate = existingTransactions.some((txn: { description: string | null; amount: number; type: string }) => 
          txn.description?.toLowerCase() === transactionDesc.toLowerCase() &&
          Math.abs(txn.amount - amount) < 0.01 &&
          txn.type === 'expense'
        )
        
        if (isDuplicate) {
          results.duplicateCount++
          continue
        }
        
        // Try to match category from description
        const categoryName = descLower.includes('rent') ? 'Rent' :
                           descLower.includes('utilit') ? 'Utilities' :
                           descLower.includes('health') ? 'Healthcare' :
                           descLower.includes('internet') || descLower.includes('mobile') ? 'Subscriptions' :
                           descLower.includes('groceries') || descLower.includes('food') ? 'Groceries' :
                           descLower.includes('transport') || descLower.includes('fuel') || descLower.includes('car') ? 'Transport' :
                           'Other Expense'
        
        const category = findCategory(categoryName, 'expense')
        if (!category) {
          results.errors.push(`No category found for: ${row.description}`)
          continue
        }

        const finalDesc = row.details ? `${row.description} - ${row.details}` : row.description
        
        await prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId: category.id,
            amount,
            type: 'expense',
            description: finalDesc,
            date: new Date(),
          }
        })
        
        // Add to existing transactions for duplicate detection within this batch
        existingTransactions.push({
          description: finalDesc,
          amount,
          type: 'expense'
        })
        
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: { decrement: amount } }
        })
        results.expenseCount++
      }
    } catch (error: any) {
      results.errors.push(`Error importing ${row.description}: ${error.message}`)
    }
  }

  return results
}

export async function parseImportData(rawData: string): Promise<ImportRow[]> {
  const lines = rawData.trim().split('\n')
  const rows: ImportRow[] = []
  let currentSection = ''

  // Detect delimiter
  const firstLine = lines[0] || ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    const columns = trimmedLine.split(delimiter).map(col => col.trim())

    // Check if this is a section header
    const firstCol = columns[0].toLowerCase()
    if (firstCol.startsWith('income source') || firstCol.includes('income source') ||
        firstCol.startsWith('fixed costs') || firstCol.includes('fixed costs') || 
        firstCol.startsWith('loans & debt') || firstCol.includes('loans & debt') || 
        firstCol.startsWith('discretionary') || firstCol.includes('discretionary')) {
      // Extract just the section name from the first column
      if (firstCol.includes('income')) currentSection = 'income source'
      else if (firstCol.includes('fixed')) currentSection = 'fixed costs'
      else if (firstCol.includes('loan') || firstCol.includes('debt')) currentSection = 'loans & debt'
      else if (firstCol.includes('discretionary')) currentSection = 'discretionary'
      continue
    }

    // Skip column headers
    if (columns.some(col => /^(detailed category|total amount|amount due|due date)/i.test(col))) {
      continue
    }

    // Skip if first column is empty or all columns are empty
    if (!columns[0] || columns.every(col => !col)) {
      continue
    }

    // Parse numeric values
    const parseAmount = (str: string): number => {
      if (!str) return 0
      const cleaned = str.replace(/[$€£¥,\s]/g, '')
      return parseFloat(cleaned) || 0
    }

    // Extract data based on column count
    const row: ImportRow = {
      description: columns[0],
      section: currentSection
    }

    // Try to find amounts (look for $ or numeric patterns)
    const numericColumns: number[] = []
    columns.forEach((col, idx) => {
      if (col && /[$€£¥]?\d+[,.]?\d*/.test(col)) {
        numericColumns.push(idx)
      }
    })

    // Assign values based on detected columns
    if (columns.length >= 2) {
      row.details = columns[1]
    }
    if (numericColumns.length >= 2) {
      row.totalAmount = parseAmount(columns[numericColumns[0]])
      row.paymentAmount = parseAmount(columns[numericColumns[1]])
    } else if (numericColumns.length === 1) {
      row.paymentAmount = parseAmount(columns[numericColumns[0]])
    }
    
    // Look for frequency
    const frequencyCol = columns.find(col => 
      /weekly|fortnightly|monthly|daily|yearly/i.test(col)
    )
    if (frequencyCol) {
      row.frequency = frequencyCol
    }

    // Look for due date - check for date patterns or "Due Date" column
    const dueDateCol = columns.find(col => 
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(col) || // matches dd/mm/yyyy or mm-dd-yyyy
      /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/.test(col) ||
      /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s+\d{4})?/i.test(col)
    )
    if (dueDateCol) {
      row.dueDate = dueDateCol
    }

    rows.push(row)
  }

  return rows
}
