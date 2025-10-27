'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePreferences } from '@/components/PreferencesProvider'

interface Account {
  id: string
  name: string
  type: string
  balance: number
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

export default function AddTransaction() {
  const router = useRouter()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
    isRecurring: false,
    recurrence: 'monthly',
    bonusAmount: '',
    includeBonusNext: false,
    notes: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [quickAddText, setQuickAddText] = useState('')

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [])

  // Set first account when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }))
    }
  }, [accounts])

  // Set first category of current type when categories are loaded or type changes
  useEffect(() => {
    const filtered = categories.filter(cat => cat.type === formData.type)
    if (filtered.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: filtered[0].id }))
    }
  }, [categories, formData.type])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
        if (data.accounts.length > 0) {
          setFormData(prev => ({ ...prev, accountId: data.accounts[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  const handleQuickAdd = (text: string) => {
    setQuickAddText(text)
    
    // Parse patterns like: "Coffee $5.50", "$20 groceries", "5.50 lunch"
    const amountPattern = /\$?(\d+\.?\d*)/
    const amountMatch = text.match(amountPattern)
    
    if (amountMatch) {
      const amount = amountMatch[1]
      // Remove the amount from text to get description
      const description = text.replace(amountMatch[0], '').trim()
      
      setFormData(prev => ({
        ...prev,
        amount,
        description: description || prev.description,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create transaction')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              💰 CashFlow
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>Record a new income or expense</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-md text-center">
                ✅ Transaction added successfully! Redirecting...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* Quick Add */}
                <div className="space-y-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <label htmlFor="quickAdd" className="text-sm font-medium flex items-center gap-2">
                    ⚡ Quick Add
                    <span className="text-xs font-normal text-gray-600">(Paste or type like: "Coffee $5.50" or "$20 groceries")</span>
                  </label>
                  <Input
                    id="quickAdd"
                    type="text"
                    placeholder="e.g., Coffee $5.50"
                    value={quickAddText}
                    onChange={(e) => handleQuickAdd(e.target.value)}
                    className="bg-white"
                  />
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        formData.type === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      💸 Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        formData.type === 'income'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      💰 Income
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount *
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                {/* Account */}
                <div className="space-y-2">
                  <label htmlFor="account" className="text-sm font-medium">
                    Account *
                  </label>
                  {accounts.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No accounts found. <Link href="/add-account" className="text-blue-600 hover:underline">Create one first</Link>
                    </div>
                  ) : (
                    <select
                      id="account"
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      required
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (${account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">No category</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="e.g., Grocery shopping"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Date
                  </label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="text-gray-900"
                    required
                  />
                </div>

                {/* Recurring Transaction */}
                <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer">
                      🔄 Recurring Transaction
                    </label>
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="space-y-2 pl-7">
                      <label htmlFor="recurrence" className="text-sm font-medium">
                        Frequency
                      </label>
                      <select
                        id="recurrence"
                        value={formData.recurrence}
                        onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Bonus Amount - Only for recurring income */}
                {formData.isRecurring && formData.type === 'income' && (
                  <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="space-y-2">
                      <label htmlFor="bonusAmount" className="text-sm font-medium flex items-center gap-2">
                        ⭐ Optional Bonus/Variable Amount
                        <span className="text-xs font-normal text-gray-600">(e.g., on-call pay, commission)</span>
                      </label>
                      <Input
                        id="bonusAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.bonusAmount}
                        onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                        className="bg-white"
                      />
                      <p className="text-xs text-gray-600">
                        This bonus can be toggled on/off for each pay period from the transactions page
                      </p>
                    </div>
                    
                    {formData.bonusAmount && parseFloat(formData.bonusAmount) > 0 && (
                      <div className="flex items-center gap-3 pt-2 border-t border-green-300">
                        <input
                          type="checkbox"
                          id="includeBonusNext"
                          checked={formData.includeBonusNext}
                          onChange={(e) => setFormData({ ...formData, includeBonusNext: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <label htmlFor="includeBonusNext" className="text-sm font-medium cursor-pointer">
                          Include bonus in next payment (${formData.bonusAmount})
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Transaction'}
                  </Button>
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
