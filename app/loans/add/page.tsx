'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { calculateMonthlyPayment, calculateTotalInterest } from '@/lib/loan-utils'

const LOAN_TYPES = [
  { value: 'mortgage', label: 'Mortgage', icon: '🏠' },
  { value: 'auto', label: 'Auto Loan', icon: '🚗' },
  { value: 'student', label: 'Student Loan', icon: '🎓' },
  { value: 'personal', label: 'Personal Loan', icon: '💰' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'payday', label: 'Payday Loan', icon: '⚡' },
  { value: 'bnpl', label: 'BNPL/Afterpay', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📋' },
]

export default function AddLoanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [termInputMode, setTermInputMode] = useState<'months' | 'payments'>('months')
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'personal',
    principal: '',
    currentBalance: '',
    interestRate: '',
    termMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    monthlyPayment: '',
    paymentDay: '1',
    lender: '',
    accountNumber: '',
    notes: '',
    color: '#ef4444',
    // BNPL and Payday specific
    paymentFrequency: 'monthly',
    numberOfPayments: '',
    feeAmount: '',
    allowSplitPayment: false,
  })

  // Convert number of payments to months based on frequency
  const convertPaymentsToMonths = (numPayments: number, frequency: string): number => {
    switch (frequency) {
      case 'weekly':
        return Math.ceil((numPayments * 7) / 30) // weeks to months
      case 'biweekly':
        return Math.ceil((numPayments * 14) / 30) // bi-weeks to months
      case 'monthly':
      default:
        return numPayments
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // If numberOfPayments changes and we're in payments mode, convert to months
    if (name === 'numberOfPayments' && termInputMode === 'payments') {
      const numPayments = parseInt(value)
      if (numPayments > 0) {
        const months = convertPaymentsToMonths(numPayments, formData.paymentFrequency)
        setFormData(prev => ({ ...prev, termMonths: months.toString() }))
      }
    }
    
    // If paymentFrequency changes and we have numberOfPayments, recalculate months
    if (name === 'paymentFrequency' && termInputMode === 'payments' && formData.numberOfPayments) {
      const numPayments = parseInt(formData.numberOfPayments)
      if (numPayments > 0) {
        const months = convertPaymentsToMonths(numPayments, value)
        setFormData(prev => ({ ...prev, termMonths: months.toString() }))
      }
    }
    
    // Auto-calculate monthly payment when principal, rate, or term changes
    if (name === 'principal' || name === 'interestRate' || name === 'termMonths') {
      const principal = name === 'principal' ? parseFloat(value) : parseFloat(formData.principal)
      const rate = name === 'interestRate' ? parseFloat(value) : parseFloat(formData.interestRate)
      const term = name === 'termMonths' ? parseInt(value) : parseInt(formData.termMonths)
      
      if (principal > 0 && rate >= 0 && term > 0) {
        const payment = calculateMonthlyPayment(principal, rate, term)
        setFormData(prev => ({ ...prev, monthlyPayment: payment.toFixed(2) }))
      }
    }
    
    // Auto-set current balance to principal if not set
    if (name === 'principal' && !formData.currentBalance) {
      setFormData(prev => ({ ...prev, currentBalance: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/loans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          principal: parseFloat(formData.principal),
          currentBalance: parseFloat(formData.currentBalance),
          interestRate: parseFloat(formData.interestRate),
          termMonths: parseInt(formData.termMonths),
          startDate: new Date(formData.startDate),
          monthlyPayment: parseFloat(formData.monthlyPayment),
          paymentDay: parseInt(formData.paymentDay),
          lender: formData.lender || undefined,
          accountNumber: formData.accountNumber || undefined,
          notes: formData.notes || undefined,
          color: formData.color,
          // BNPL and Payday specific fields
          paymentFrequency: formData.paymentFrequency || undefined,
          numberOfPayments: formData.numberOfPayments ? parseInt(formData.numberOfPayments) : undefined,
          feeAmount: formData.feeAmount ? parseFloat(formData.feeAmount) : undefined,
          allowSplitPayment: formData.allowSplitPayment,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create loan')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/loans')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculatedTotalInterest = 
    formData.principal && formData.interestRate && formData.termMonths
      ? calculateTotalInterest(
          parseFloat(formData.principal),
          parseFloat(formData.interestRate),
          parseInt(formData.termMonths)
        )
      : 0

  const totalCost = 
    formData.principal && calculatedTotalInterest
      ? parseFloat(formData.principal) + calculatedTotalInterest
      : 0

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Loan Added Successfully!</h3>
            <p className="text-gray-600">Redirecting to loans page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/loans">
            <Button variant="outline">← Back to Loans</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Loan</CardTitle>
            <CardDescription>
              Track your loan details and payment schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {LOAN_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g., Car Loan, Mortgage"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Principal and Current Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-1">
                    Original Amount *
                  </label>
                  <Input
                    id="principal"
                    name="principal"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.principal}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Balance *
                  </label>
                  <Input
                    id="currentBalance"
                    name="currentBalance"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.currentBalance}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Interest Rate and Term */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%) *
                  </label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    step="0.01"
                    required
                    placeholder="5.5"
                    value={formData.interestRate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="termInput" className="block text-sm font-medium text-gray-700">
                      {termInputMode === 'months' ? 'Term (Months) *' : 'Number of Payments *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTermInputMode(prev => prev === 'months' ? 'payments' : 'months')
                        // Clear the inputs when switching
                        if (termInputMode === 'months') {
                          setFormData(prev => ({ ...prev, numberOfPayments: '', termMonths: '' }))
                        } else {
                          setFormData(prev => ({ ...prev, numberOfPayments: '', termMonths: '' }))
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Switch to {termInputMode === 'months' ? 'Payments' : 'Months'}
                    </button>
                  </div>
                  {termInputMode === 'months' ? (
                    <Input
                      id="termMonths"
                      name="termMonths"
                      type="number"
                      required
                      placeholder="60"
                      value={formData.termMonths}
                      onChange={handleChange}
                    />
                  ) : (
                    <Input
                      id="numberOfPayments"
                      name="numberOfPayments"
                      type="number"
                      required
                      placeholder="4"
                      value={formData.numberOfPayments}
                      onChange={handleChange}
                    />
                  )}
                  {termInputMode === 'payments' && formData.termMonths && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {formData.termMonths} months based on {formData.paymentFrequency} frequency
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <Input
                  id="monthlyPayment"
                  name="monthlyPayment"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.monthlyPayment}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated based on loan terms</p>
              </div>

              {/* Payment Day - conditional based on frequency */}
              {formData.paymentFrequency === 'monthly' ? (
                <div>
                  <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Day of Month *
                  </label>
                  <Input
                    id="paymentDay"
                    name="paymentDay"
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="1"
                    value={formData.paymentDay}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Day of month (1-31)</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Day of Week *
                  </label>
                  <select
                    id="paymentDay"
                    name="paymentDay"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={formData.paymentDay}
                    onChange={handleChange}
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

              {/* Payment Frequency */}
              <div>
                <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Frequency *
                </label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={formData.paymentFrequency}
                  onChange={handleChange}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              {/* Lender and Account Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lender" className="block text-sm font-medium text-gray-700 mb-1">
                    Lender (Optional)
                  </label>
                  <Input
                    id="lender"
                    name="lender"
                    type="text"
                    placeholder="Bank name"
                    value={formData.lender}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number (Optional)
                  </label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    placeholder="Last 4 digits"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* BNPL Specific Fields */}
              {formData.type === 'bnpl' && (
                <>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-purple-900">BNPL/Afterpay Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Frequency *
                        </label>
                        <select
                          id="paymentFrequency"
                          name="paymentFrequency"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          value={formData.paymentFrequency}
                          onChange={handleChange}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="numberOfPayments" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Payments *
                        </label>
                        <Input
                          id="numberOfPayments"
                          name="numberOfPayments"
                          type="number"
                          min="1"
                          placeholder="e.g., 4"
                          value={formData.numberOfPayments}
                          onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical: 4 payments</p>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Late Fee Amount (Optional)
                      </label>
                      <Input
                        id="feeAmount"
                        name="feeAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.feeAmount}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Payday Loan Specific Fields */}
              {formData.type === 'payday' && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-yellow-900">Payday Loan Details</h4>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="allowSplitPayment"
                        name="allowSplitPayment"
                        checked={formData.allowSplitPayment}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowSplitPayment: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="allowSplitPayment" className="text-sm font-medium text-gray-700">
                        Allow Split Payment (Pay in installments vs. full amount)
                      </label>
                    </div>
                    
                    <div>
                      <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Service/Interest Fee
                      </label>
                      <Input
                        id="feeAmount"
                        name="feeAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.feeAmount}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">Total fee amount for the loan</p>
                    </div>
                    
                    <div className="bg-yellow-100 p-3 rounded text-sm text-yellow-800">
                      ⚠️ <strong>Note:</strong> Payday loans typically have very high APR and short repayment terms (2-4 weeks). Consider alternatives if possible.
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Additional notes about this loan"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              {/* Loan Summary */}
              {formData.principal && formData.interestRate && formData.termMonths && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-blue-900">Loan Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700">Monthly Payment:</span>
                      <span className="font-semibold ml-2">${formData.monthlyPayment}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Interest:</span>
                      <span className="font-semibold ml-2">${calculatedTotalInterest.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Cost:</span>
                      <span className="font-semibold ml-2">${totalCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Payoff Date:</span>
                      <span className="font-semibold ml-2">
                        {new Date(new Date(formData.startDate).setMonth(
                          new Date(formData.startDate).getMonth() + parseInt(formData.termMonths)
                        )).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Adding Loan...' : 'Add Loan'}
                </Button>
                <Link href="/loans" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
