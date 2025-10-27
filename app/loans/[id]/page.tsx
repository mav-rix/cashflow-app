'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  startDate: string
  endDate: string | null
  isActive: boolean
  isPaidOff: boolean
  color: string | null
}

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
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

export default function LoanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [loan, setLoan] = useState<Loan | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (params.id) {
      fetchLoanDetails()
    }
  }, [params.id])

  const fetchLoanDetails = async () => {
    try {
      const res = await fetch(`/api/loans/${params.id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (res.status === 404) {
          router.push('/loans')
          return
        }
        throw new Error('Failed to fetch loan details')
      }
      const data = await res.json()
      setLoan(data.loan)
      setRecentPayments(data.recentPayments || [])
    } catch (error) {
      console.error('Error fetching loan details:', error)
      router.push('/loans')
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (current: number, principal: number) => {
    const paid = principal - current
    return (paid / principal) * 100
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

  if (!loan) {
    return null
  }

  const progress = getProgressPercentage(loan.currentBalance, loan.principal)
  const totalPaid = loan.principal - loan.currentBalance

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">{LOAN_TYPE_ICONS[loan.type] || '📋'}</span>
              {loan.name}
            </h1>
            <p className="text-gray-600 mt-1">{LOAN_TYPE_LABELS[loan.type]}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings">
              <Button variant="ghost" className="h-10 w-10 p-0">
                ⚙️
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline">Back to Loans</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                    <div className="text-4xl font-bold text-gray-900">
                      {formatCurrency(loan.currentBalance)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Original Amount</div>
                      <div className="text-lg font-semibold">{formatCurrency(loan.principal)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Paid</div>
                      <div className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(loan.monthlyPayment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Day</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {loan.paymentDay}{loan.paymentDay === 1 ? 'st' : loan.paymentDay === 2 ? 'nd' : loan.paymentDay === 3 ? 'rd' : 'th'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Interest Rate</div>
                    <div className="text-xl font-semibold">{loan.interestRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Term</div>
                    <div className="text-xl font-semibold">{loan.termMonths} months</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            {recentPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Payments</CardTitle>
                    <Link href={`/loans/${loan.id}/payments`}>
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-gray-600">
                            Due: {formatDate(payment.dueDate)}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loan Info */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loan.lender && (
                  <div>
                    <div className="text-sm text-gray-600">Lender</div>
                    <div className="font-medium">{loan.lender}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-medium">{formatDate(loan.startDate)}</div>
                </div>
                {loan.endDate && (
                  <div>
                    <div className="text-sm text-gray-600">End Date</div>
                    <div className="font-medium">{formatDate(loan.endDate)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      loan.isPaidOff
                        ? 'bg-green-100 text-green-700'
                        : loan.isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {loan.isPaidOff ? 'Paid Off' : loan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/loans/${loan.id}/payments`}>
                  <Button className="w-full" variant="outline">
                    View Payment History
                  </Button>
                </Link>
                <Link href="/loans">
                  <Button className="w-full" variant="outline">
                    Make Payment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
