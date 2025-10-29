'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { usePreferences } from '@/components/PreferencesProvider'

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  period: string
  category: {
    name: string
    icon: string | null
    color: string | null
  }
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

export default function BudgetsPage() {
  const router = useRouter()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    alertAt: '80',
  })
  const [editFormData, setEditFormData] = useState({
    amount: '',
    period: 'monthly',
    alertAt: '80',
  })

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories.filter((c: Category) => c.type === 'expense'))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch budgets')
      }
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressPercentage = (spent: number, amount: number) => {
    return Math.min((spent / amount) * 100, 100)
  }

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${category.name} Budget`,
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          period: formData.period,
          alertAt: formData.alertAt ? parseFloat(formData.alertAt) : null,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setFormData({ categoryId: '', amount: '', period: 'monthly', alertAt: '80' })
        fetchBudgets()
      } else {
        console.error('Failed to create budget')
      }
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const res = await fetch(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchBudgets()
      } else {
        console.error('Failed to delete budget')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setEditFormData({
      amount: budget.amount.toString(),
      period: budget.period,
      alertAt: '80',
    })
    setShowEditModal(true)
  }

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget) return

    try {
      const res = await fetch('/api/budgets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBudget.id,
          amount: parseFloat(editFormData.amount),
          period: editFormData.period,
          alertAt: editFormData.alertAt ? parseFloat(editFormData.alertAt) : null,
        }),
      })

      if (res.ok) {
        setShowEditModal(false)
        setEditingBudget(null)
        fetchBudgets()
      } else {
        console.error('Failed to update budget')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-1">Track and manage your spending limits</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={() => setShowAddModal(true)}>Add Budget</Button>
          </div>
        </div>

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">No budgets yet</h3>
              <p className="text-gray-600 mb-6">
                Create budgets to track your spending by category and stay on top of your finances
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h4 className="font-semibold text-blue-900 mb-3">Coming Soon!</h4>
                <p className="text-sm text-blue-800 mb-4">
                  The budget management feature is currently under development. Soon you&apos;ll be able to:
                </p>
                <ul className="text-sm text-blue-800 text-left space-y-2 max-w-md mx-auto">
                  <li>✅ Set monthly spending limits for each category</li>
                  <li>✅ Track your spending in real-time</li>
                  <li>✅ Get alerts when you&apos;re close to your budget</li>
                  <li>✅ View budget vs actual spending reports</li>
                  <li>✅ Set recurring budgets that reset monthly</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const percentage = getProgressPercentage(budget.spent, budget.amount)
              const remaining = budget.amount - budget.spent

              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{budget.category.icon || '📊'}</div>
                        <div>
                          <CardTitle className="text-lg">{budget.category.name}</CardTitle>
                          <CardDescription className="capitalize">{budget.period}</CardDescription>
                        </div>
                      </div>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(openMenuId === budget.id ? null : budget.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <span style={{ letterSpacing: '0.2em' }}>⋮</span>
                        </Button>
                        {openMenuId === budget.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  handleEditBudget(budget)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteBudget(budget.id)
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Amount Info */}
                      <div className="flex justify-between items-baseline">
                        <div>
                          <div className="text-sm text-gray-600">Spent</div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(budget.spent)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Budget</div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(budget.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{percentage.toFixed(0)}% used</span>
                          <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            {remaining >= 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))} 
                            {remaining >= 0 ? ' left' : ' over'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all ${getProgressColor(percentage)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Warning */}
                      {percentage >= 100 && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Budget exceeded
                        </div>
                      )}
                      {percentage >= 80 && percentage < 100 && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                          ⚡ Close to budget limit
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Add Budget Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Add Budget</h2>
              <form onSubmit={handleAddBudget}>
                <div className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Amount
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {/* Alert Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert at % (optional)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.alertAt}
                      onChange={(e) => setFormData({ ...formData, alertAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when you reach this percentage of your budget
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ categoryId: '', amount: '', period: 'monthly', alertAt: '80' })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Budget
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {showEditModal && editingBudget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Edit Budget</h2>
              <form onSubmit={handleUpdateBudget}>
                <div className="space-y-4">
                  {/* Category (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                      {editingBudget.category.icon} {editingBudget.category.name}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Amount
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period
                    </label>
                    <select
                      value={editFormData.period}
                      onChange={(e) => setEditFormData({ ...editFormData, period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {/* Alert Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert at % (optional)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editFormData.alertAt}
                      onChange={(e) => setEditFormData({ ...editFormData, alertAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when you reach this percentage of your budget
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingBudget(null)
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
