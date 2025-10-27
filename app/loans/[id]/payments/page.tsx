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
  monthlyPayment: number
}

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  principalPaid: number | null
  interestPaid: number | null
  notes: string | null
}

export default function PaymentHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [loan, setLoan] = useState<Loan | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')

  useEffect(() => {
    if (params.id) {
      fetchPaymentHistory()
    }
  }, [params.id])

  const fetchPaymentHistory = async () => {
    try {
      const res = await fetch(`/api/loans/${params.id}/payments`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (res.status === 404) {
          router.push('/loans')
          return
        }
        throw new Error('Failed to fetch payment history')
      }
      const data = await res.json()
      setLoan(data.loan)
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
      router.push('/loans')
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true
    return payment.status === filter
  })

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const upcomingPayments = payments.filter(p => p.status === 'pending').length
  const overduePayments = payments.filter(p => p.status === 'overdue').length

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600 mt-1">{loan.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings">
              <Button variant="ghost" className="h-10 w-10 p-0">
                ⚙️
              </Button>
            </Link>
            <Link href={`/loans/${params.id}`}>
              <Button variant="outline">Back to Loan</Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(loan.monthlyPayment)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Upcoming</div>
              <div className="text-2xl font-bold text-blue-600">
                {upcomingPayments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Overdue</div>
              <div className="text-2xl font-bold text-red-600">
                {overduePayments}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({payments.length})
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            onClick={() => setFilter('paid')}
          >
            Paid ({payments.filter(p => p.status === 'paid').length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({upcomingPayments})
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilter('overdue')}
          >
            Overdue ({overduePayments})
          </Button>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2">No payments found</h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'No payment records available'
                    : `No ${filter} payments`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => {
                  const isOverdue = payment.status === 'overdue'
                  const isPaid = payment.status === 'paid'
                  const isPending = payment.status === 'pending'

                  return (
                    <div
                      key={payment.id}
                      className={`p-4 rounded-lg border ${
                        isOverdue
                          ? 'border-red-200 bg-red-50'
                          : isPaid
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-2xl">
                              {isPaid ? '✅' : isPending ? '⏰' : '⚠️'}
                            </div>
                            <div>
                              <div className="font-semibold text-lg">
                                {formatCurrency(payment.amount)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Due: {formatDate(payment.dueDate)}
                              </div>
                            </div>
                          </div>
                          {payment.paidDate && (
                            <div className="text-sm text-gray-600 ml-11">
                              Paid: {formatDate(payment.paidDate)}
                            </div>
                          )}
                          {(payment.principalPaid || payment.interestPaid) && (
                            <div className="text-sm text-gray-600 ml-11 mt-1">
                              Principal: {formatCurrency(payment.principalPaid || 0)} | 
                              Interest: {formatCurrency(payment.interestPaid || 0)}
                            </div>
                          )}
                          {payment.notes && (
                            <div className="text-sm text-gray-600 ml-11 mt-1 italic">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        <div>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              isPaid
                                ? 'bg-green-100 text-green-700'
                                : isPending
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
