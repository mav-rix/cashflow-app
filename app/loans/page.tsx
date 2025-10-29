'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { usePreferences } from '@/components/PreferencesProvider'

interface Loan {
  id: string
  name: string
  type: string
  principal: number
  currentBalance: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
  paymentDay: number
  lender: string | null
  isActive: boolean
  isPaidOff: boolean
  isDisabled: boolean
  color: string | null
  startDate: string
  endDate: string | null
  payments: Payment[]
  paymentFrequency?: string | null
  numberOfPayments?: number | null
  feeAmount?: number | null
  allowSplitPayment?: boolean
}

interface Payment {
  id: string
  dueDate: string
  amount: number
  status: string
}

interface LoanSummary {
  totalDebt: number
  totalMonthlyPayment: number
  activeLoans: number
  totalLoans: number
}

const LOAN_TYPE_ICONS: Record<string, string> = {
  mortgage: '🏠',
  auto: '🚗',
  student: '🎓',
  personal: '💳',
  credit_card: '💳',
  payday: '⚡',
  bnpl: '🛍️',
  other: '📋',
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  auto: 'Auto Loan',
  student: 'Student Loan',
  personal: 'Personal Loan',
  credit_card: 'Credit Card',
  payday: 'Payday Loan',
  bnpl: 'BNPL/Afterpay',
  other: 'Other',
}

export default function LoansPage() {
  const router = useRouter()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [summary, setSummary] = useState<LoanSummary>({
    totalDebt: 0,
    totalMonthlyPayment: 0,
    activeLoans: 0,
    totalLoans: 0,
  })
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    interestRate: '',
    termMonths: '',
    monthlyPayment: '',
    paymentDay: '',
    paymentFrequency: 'monthly',
    lender: '',
    color: '',
  })

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch loans')
      }
      const data = await res.json()
      setLoans(data.loans)
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/loans?id=${loanId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchLoans()
      } else {
        console.error('Failed to delete loan')
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
    }
  }

  const handleToggleDisable = async (loanId: string) => {
    try {
      const res = await fetch('/api/loans/toggle-disable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loanId }),
      })

      if (res.ok) {
        fetchLoans()
      } else {
        console.error('Failed to toggle loan disable status')
      }
    } catch (error) {
      console.error('Error toggling loan disable:', error)
    }
  }

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan)
    setFormData({
      name: loan.name,
      principal: loan.principal.toString(),
      interestRate: loan.interestRate.toString(),
      termMonths: loan.termMonths.toString(),
      monthlyPayment: loan.monthlyPayment.toString(),
      paymentDay: loan.paymentDay.toString(),
      paymentFrequency: loan.paymentFrequency || 'monthly',
      lender: loan.lender || '',
      color: loan.color || '',
    })
    setShowEditModal(true)
  }

  const handleUpdateLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLoan) return

    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLoan.id,
          ...formData,
        }),
      })

      if (res.ok) {
        setShowEditModal(false)
        setEditingLoan(null)
        fetchLoans()
      } else {
        console.error('Failed to update loan')
      }
    } catch (error) {
      console.error('Error updating loan:', error)
    }
  }

  const getNextPayment = (loan: Loan) => {
    const now = new Date()
    const nextPayment = loan.payments.find((p: any) => 
      p.status === 'pending' && new Date(p.dueDate) >= now
    )
    return nextPayment
  }

  const getPayoffProgress = (loan: Loan) => {
    const paidOff = loan.principal - loan.currentBalance
    return (paidOff / loan.principal) * 100
  }

  const getDaysUntilPayment = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loans & Debts</h1>
            <p className="text-gray-600 mt-1">Track and manage your loans, debts, and payment schedules</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link href="/loans/add">
              <Button>Add Loan</Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Debt</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {formatCurrency(summary.totalDebt)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payment (All Frequencies)</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(summary.totalMonthlyPayment)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Loans</CardDescription>
              <CardTitle className="text-3xl">
                {summary.activeLoans}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Loans</CardDescription>
              <CardTitle className="text-3xl">
                {summary.totalLoans}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Loans List */}
        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">No loans yet</h3>
              <p className="text-gray-600 mb-6">Start tracking your loans and debts to stay on top of payments</p>
              <Link href="/loans/add">
                <Button>Add Your First Loan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {loans.map((loan) => {
              const nextPayment = getNextPayment(loan)
              const progress = getPayoffProgress(loan)
              
              return (
                <Card key={loan.id} className={loan.isPaidOff || loan.isDisabled ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-4xl">{LOAN_TYPE_ICONS[loan.type]}</div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{loan.name}</CardTitle>
                          <CardDescription>
                            {LOAN_TYPE_LABELS[loan.type]}
                            {loan.lender && ` • ${loan.lender}`}
                            {loan.isPaidOff && ' • Paid Off 🎉'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(loan.currentBalance)}
                          </div>
                          <div className="text-sm text-gray-500">
                            of {formatCurrency(loan.principal)}
                          </div>
                        </div>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenMenuId(openMenuId === loan.id ? null : loan.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <span style={{ letterSpacing: '0.2em' }}>⋮</span>
                          </Button>
                          {openMenuId === loan.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    handleEditLoan(loan)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleToggleDisable(loan.id)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                >
                                  🚫 {loan.isDisabled ? 'Enable' : 'Disable'}
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteLoan(loan.id)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Payoff Progress</span>
                        <span>{progress.toFixed(1)}% paid</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {loan.type === 'bnpl' ? (
                        <>
                          <div>
                            <div className="text-sm text-gray-600">Payment Amount</div>
                            <div className="font-semibold">{formatCurrency(loan.monthlyPayment)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Frequency</div>
                            <div className="font-semibold capitalize">
                              {loan.paymentFrequency || 'Biweekly'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Installments</div>
                            <div className="font-semibold">
                              {loan.numberOfPayments || 4} payments
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Interest Rate</div>
                            <div className="font-semibold text-green-600">0% APR</div>
                          </div>
                        </>
                      ) : loan.type === 'payday' ? (
                        <>
                          <div>
                            <div className="text-sm text-gray-600">Payment Type</div>
                            <div className="font-semibold">
                              {loan.allowSplitPayment ? 'Split Payment' : 'Full Amount'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Fee Amount</div>
                            <div className="font-semibold text-red-600">
                              {formatCurrency(loan.feeAmount || 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Term</div>
                            <div className="font-semibold">{loan.termMonths} months</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Effective APR</div>
                            <div className="font-semibold text-red-600">{loan.interestRate.toFixed(2)}%</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="text-sm text-gray-600">
                              {loan.paymentFrequency === 'weekly' ? 'Weekly Payment' : 
                               loan.paymentFrequency === 'biweekly' ? 'Fortnightly Payment' : 
                               'Monthly Payment'}
                            </div>
                            <div className="font-semibold">{formatCurrency(loan.monthlyPayment)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Interest Rate</div>
                            <div className="font-semibold">{loan.interestRate.toFixed(2)}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              {loan.paymentFrequency === 'weekly' || loan.paymentFrequency === 'biweekly' ? 'Payment Day' : 'Payment Day of Month'}
                            </div>
                            <div className="font-semibold">
                              {loan.paymentFrequency === 'weekly' || loan.paymentFrequency === 'biweekly' 
                                ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][loan.paymentDay]
                                : `Day ${loan.paymentDay}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Term</div>
                            <div className="font-semibold">{loan.termMonths} months</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Next Payment */}
                    {nextPayment && !loan.isPaidOff && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-blue-900 font-medium">Next Payment</div>
                            <div className="text-blue-700">
                              {new Date(nextPayment.dueDate).toLocaleDateString()} • {formatCurrency(nextPayment.amount)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-blue-900">
                              {getDaysUntilPayment(nextPayment.dueDate) === 0 ? (
                                <span className="text-red-600 font-semibold">Due Today!</span>
                              ) : getDaysUntilPayment(nextPayment.dueDate) < 0 ? (
                                <span className="text-red-600 font-semibold">Overdue!</span>
                              ) : (
                                `in ${getDaysUntilPayment(nextPayment.dueDate)} days`
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <Link href={`/loans/${loan.id}/payments`}>
                        <Button variant="outline" size="sm">Payment History</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Edit Loan Modal */}
        {showEditModal && editingLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Edit Loan</h2>
              <form onSubmit={handleUpdateLoan}>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Principal Amount
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.principal}
                      onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Term in Months */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Term (Months)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.termMonths}
                      onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.paymentFrequency === 'weekly' ? 'Weekly Payment' : 
                       formData.paymentFrequency === 'biweekly' ? 'Fortnightly Payment' : 
                       'Monthly Payment'}
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.monthlyPayment}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Payment Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Frequency
                    </label>
                    <select
                      value={formData.paymentFrequency}
                      onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Payment Day - conditional */}
                  {formData.paymentFrequency === 'monthly' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Day of Month
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="31"
                        value={formData.paymentDay}
                        onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-1">Day of month (1-31)</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Day of Week
                      </label>
                      <select
                        value={formData.paymentDay}
                        onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      >
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="0">Sunday</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Day of the week for payment</p>
                    </div>
                  )}

                  {/* Lender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lender (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.lender}
                      onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color (Optional)
                    </label>
                    <input
                      type="color"
                      value={formData.color || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingLoan(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
