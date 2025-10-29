'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { usePreferences } from '@/components/PreferencesProvider'
import { OnboardingTour } from '@/components/onboarding-tour'

interface Stats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  accountsCount: number
  netIncome: number
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  date: string
  isDisabled: boolean
  category: {
    name: string
    color: string | null
    icon: string | null
  } | null
  account: {
    name: string
  }
  categoryId?: string | null
  accountId?: string | null
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
}

interface Account {
  id: string
  name: string
  type: string
}

export default function Dashboard() {
  const router = useRouter()
  const { preferences, setPreferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: '',
    categoryId: '',
    accountId: '',
  })
  const [stats, setStats] = useState<Stats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    accountsCount: 0,
    netIncome: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [upcomingItems, setUpcomingItems] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    fetchCategories()
    fetchAccounts()
    fetchUpcoming()
    checkOnboardingStatus()
  }, [preferences.statsPeriod])

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/user/onboarding')
      if (res.ok) {
        const data = await res.json()
        setShowOnboarding(!data.onboardingCompleted)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  const handleOnboardingComplete = async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' })
      setShowOnboarding(false)
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  const handleOnboardingSkip = async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' })
      setShowOnboarding(false)
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    }
  }

  const fetchUpcoming = async () => {
    try {
      const response = await fetch('/api/upcoming')
      if (response.ok) {
        const data = await response.json()
        // console.log('Upcoming data:', data)
        // console.log('Items count:', data.items?.length)
        setUpcomingItems(data.items.slice(0, 3)) // Get only next 3 items
      }
    } catch (error) {
      console.error('Error fetching upcoming:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
    }
  }

  const fetchData = async () => {
    try {
      // Fetch stats with period
      const statsRes = await fetch(`/api/stats?period=${preferences.statsPeriod}`)
      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          router.push('/auth/signin')
          return
        }
        // Set default empty stats instead of throwing
        setStats({
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          accountsCount: 0,
          netIncome: 0
        })
      } else {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Fetch recent transactions
      const transactionsRes = await fetch('/api/transactions')
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData.transactions)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      description: transaction.description || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
      categoryId: transaction.categoryId || '',
      accountId: transaction.accountId || '',
    })
    setShowEditModal(true)
  }

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return

    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTransaction.id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description,
          date: formData.date,
          categoryId: formData.categoryId || null,
          accountId: formData.accountId,
        }),
      })

      if (res.ok) {
        setShowEditModal(false)
        setEditingTransaction(null)
        fetchData()
      } else {
      }
    } catch (error) {
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const res = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData() // Refresh data
      } else {
      }
    } catch (error) {
    }
  }

  const handleToggleDisable = async (transactionId: string) => {
    try {
      const res = await fetch('/api/transactions/toggle-disable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId }),
      })

      if (res.ok) {
        fetchData() // Refresh data
      } else {
        console.error('Failed to toggle transaction disable status')
      }
    } catch (error) {
      console.error('Error toggling transaction disable:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                💰 CashFlow
              </Link>
              <div className="hidden md:flex gap-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/upcoming" className="text-gray-700 hover:text-blue-600">
                  Upcoming
                </Link>
                <Link href="/transactions" className="text-gray-700 hover:text-blue-600">
                  Transactions
                </Link>
                <Link href="/budgets" className="text-gray-700 hover:text-blue-600">
                  Budgets
                </Link>
                <Link href="/accounts" className="text-gray-700 hover:text-blue-600">
                  Accounts
                </Link>
                <Link href="/loans" className="text-gray-700 hover:text-blue-600">
                  Loans
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings">
                <Button variant="ghost" className="px-2" title="Settings">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s your financial overview.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats.totalBalance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {preferences.statsPeriod === 'weekly' ? 'Weekly' : preferences.statsPeriod === 'biweekly' ? 'Fortnightly' : 'Monthly'} Income
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.monthlyIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {preferences.statsPeriod === 'weekly' ? 'Weekly' : preferences.statsPeriod === 'biweekly' ? 'Fortnightly' : 'Monthly'} Expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(stats.monthlyExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.netIncome >= 0 ? 'Surplus' : 'Deficit'} this {preferences.statsPeriod === 'weekly' ? 'week' : preferences.statsPeriod === 'biweekly' ? 'fortnight' : 'month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview Card */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              <span>
                {preferences.statsPeriod === 'weekly' ? 'Weekly' : preferences.statsPeriod === 'biweekly' ? 'Fortnightly' : 'Monthly'} Financial Overview
              </span>
            </CardTitle>
            <CardDescription>
              Showing data for {
                preferences.statsPeriod === 'weekly' ? 'this week' : 
                preferences.statsPeriod === 'biweekly' ? 'the past 2 weeks' :
                new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </CardDescription>
          </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Income */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📈</span>
                    <h3 className="font-semibold text-gray-700">Income</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {formatCurrency(stats.monthlyIncome)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total earnings this {preferences.statsPeriod === 'weekly' ? 'week' : preferences.statsPeriod === 'biweekly' ? 'fortnight' : 'month'}
                  </div>
                </div>

                {/* Expenses */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📉</span>
                    <h3 className="font-semibold text-gray-700">Expenses</h3>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {formatCurrency(stats.monthlyExpenses)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total spent this {preferences.statsPeriod === 'weekly' ? 'week' : preferences.statsPeriod === 'biweekly' ? 'fortnight' : 'month'}
                  </div>
                </div>

                {/* Savings Rate */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💎</span>
                    <h3 className="font-semibold text-gray-700">Savings Rate</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {stats.monthlyIncome > 0 
                      ? `${((stats.netIncome / stats.monthlyIncome) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.netIncome >= 0 ? 'Of income saved' : 'Over budget'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {stats.monthlyIncome > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Budget Usage</span>
                    <span>{((stats.monthlyExpenses / stats.monthlyIncome) * 100).toFixed(1)}% of income</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        stats.monthlyExpenses > stats.monthlyIncome 
                          ? 'bg-red-500' 
                          : stats.monthlyExpenses > stats.monthlyIncome * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((stats.monthlyExpenses / stats.monthlyIncome) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  {stats.monthlyExpenses > stats.monthlyIncome && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ You&apos;re spending more than you earn this {preferences.statsPeriod === 'weekly' ? 'week' : preferences.statsPeriod === 'biweekly' ? 'fortnight' : 'month'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/add-transaction">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="text-4xl mb-2">💸</div>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>
                  Record a new income or expense
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/budgets">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="text-4xl mb-2">�</div>
                <CardTitle>Budgets</CardTitle>
                <CardDescription>
                  Set and track spending limits
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/loans">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="text-4xl mb-2">🏦</div>
                <CardTitle>Manage Loans</CardTitle>
                <CardDescription>
                  Track debts and payment schedules
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/accounts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="text-4xl mb-2">💳</div>
                <CardTitle>View Accounts</CardTitle>
                <CardDescription>
                  Manage your {stats.accountsCount} {stats.accountsCount === 1 ? 'account' : 'accounts'}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Upcoming Payments Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Upcoming Payments</span>
                </CardTitle>
                <CardDescription>Your next scheduled payments and income</CardDescription>
              </div>
              <Link href="/upcoming">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No upcoming payments scheduled</p>
                <p className="text-sm">Add recurring transactions or loans to see upcoming payments here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingItems.map((item, idx) => {
                  const dueDate = new Date(item.dueDate);
                  const today = new Date();
                  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntil < 0;
                  const isDueSoon = daysUntil >= 0 && daysUntil <= 7;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                        isOverdue
                          ? 'border-red-500 bg-red-50'
                          : isDueSoon
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : item.type === 'loan'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type === 'income' ? 'Income' : item.type === 'loan' ? 'Loan' : 'Expense'}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{item.frequency}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mt-1">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          <span className={`ml-2 ${isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-yellow-600 font-semibold' : ''}`}>
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `(in ${daysUntil} days)`}
                          </span>
                        </p>
                      </div>
                      <div className={`text-xl font-bold ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No transactions yet</p>
                <Link href="/add-transaction">
                  <Button>Add Your First Transaction</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 ${
                      transaction.isDisabled ? 'opacity-50 bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">
                        {transaction.category?.icon || (transaction.type === 'income' ? '💰' : '💸')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {transaction.description || transaction.category?.name || 'Transaction'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.account.name} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(openMenuId === transaction.id ? null : transaction.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <span style={{ letterSpacing: '0.2em' }}>⋮</span>
                        </Button>
                        {openMenuId === transaction.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  handleEditTransaction(transaction)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleDisable(transaction.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                              >
                                🚫 {transaction.isDisabled ? 'Enable' : 'Disable'}
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteTransaction(transaction.id)
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
                ))}
                <div className="text-center pt-4">
                  <Link href="/transactions">
                    <Button variant="outline">View All Transactions</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Transaction Modal */}
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Edit Transaction</h2>
              <form onSubmit={handleUpdateTransaction}>
                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Select a category</option>
                      {categories
                        .filter(c => c.type === formData.type)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account
                    </label>
                    <select
                      required
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Select an account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingTransaction(null)
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

        {/* Onboarding Tour */}
        {showOnboarding && (
          <OnboardingTour
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </div>
    </div>
  )
}
