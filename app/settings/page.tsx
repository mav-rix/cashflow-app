'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePreferences } from '@/components/PreferencesProvider'

interface Preferences {
  currency: string
  dateFormat: string
  locale: string
  statsPeriod: 'weekly' | 'biweekly' | 'monthly'
}

interface UserInfo {
  name: string | null
  email: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { preferences: globalPreferences, setPreferences: setGlobalPreferences, refreshPreferences } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [preferences, setPreferences] = useState<Preferences>({
    currency: 'AUD',
    dateFormat: 'dd/MM/yyyy',
    locale: 'en-AU',
    statsPeriod: 'monthly',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        console.error('Failed to fetch settings:', res.status)
        // Continue with default values instead of throwing
      } else {
        const data = await res.json()
        setPreferences(data.preferences)
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to save settings')
        return
      }

      // Update global preferences immediately
      setGlobalPreferences(preferences)
      
      // Also refresh from server to be sure
      if (refreshPreferences) {
        await refreshPreferences()
      }

      setMessage('Settings saved successfully!')
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error saving settings. Please try again.'
      setMessage(errorMessage)
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your preferences and account settings</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={user?.name || 'Not set'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>Customize how currency and dates are displayed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                >
                  <option value="AUD">AUD - Australian Dollar ($)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="JPY">JPY - Japanese Yen (¥)</option>
                  <option value="CAD">CAD - Canadian Dollar ($)</option>
                  <option value="NZD">NZD - New Zealand Dollar ($)</option>
                  <option value="SGD">SGD - Singapore Dollar ($)</option>
                  <option value="HKD">HKD - Hong Kong Dollar ($)</option>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Example: {new Intl.NumberFormat(preferences.locale, {
                    style: 'currency',
                    currency: preferences.currency,
                  }).format(1234.56)}
                </p>
              </div>

              {/* Date Format */}
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                >
                  <option value="dd/MM/yyyy">DD/MM/YYYY (26/10/2025)</option>
                  <option value="dd/MM/yy">DD/MM/YY (26/10/25)</option>
                  <option value="MM/dd/yyyy">MM/DD/YYYY (10/26/2025)</option>
                  <option value="MM/dd/yy">MM/DD/YY (10/26/25)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Example: {(() => {
                    const now = new Date()
                    const day = now.getDate().toString().padStart(2, '0')
                    const month = (now.getMonth() + 1).toString().padStart(2, '0')
                    const year = now.getFullYear()
                    const shortYear = year.toString().slice(-2)
                    
                    if (preferences.dateFormat === 'dd/MM/yyyy') return `${day}/${month}/${year}`
                    if (preferences.dateFormat === 'dd/MM/yy') return `${day}/${month}/${shortYear}`
                    if (preferences.dateFormat === 'MM/dd/yyyy') return `${month}/${day}/${year}`
                    if (preferences.dateFormat === 'MM/dd/yy') return `${month}/${day}/${shortYear}`
                    return `${day}/${month}/${shortYear}`
                  })()}
                </p>
              </div>

              {/* Locale */}
              <div>
                <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
                  Locale (Number Formatting)
                </label>
                <select
                  id="locale"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={preferences.locale}
                  onChange={(e) => setPreferences({ ...preferences, locale: e.target.value })}
                >
                  <option value="en-AU">English (Australia)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="en-CA">English (Canada)</option>
                  <option value="en-NZ">English (New Zealand)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="fr-FR">Français (France)</option>
                  <option value="de-DE">Deutsch (Germany)</option>
                  <option value="ja-JP">日本語 (Japan)</option>
                  <option value="zh-CN">中文 (China)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Affects decimal separators and number formatting
                </p>
              </div>

              {/* Stats Period */}
              <div>
                <label htmlFor="statsPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                  Dashboard Stats Period
                </label>
                <select
                  id="statsPeriod"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={preferences.statsPeriod}
                  onChange={(e) => setPreferences({ ...preferences, statsPeriod: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Fortnightly (Bi-weekly)</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Default time period for income/expense statistics on dashboard
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
              {message && (
                <p className={`mt-2 text-sm text-center ${
                  message.includes('Error') ? 'text-red-600' : 'text-green-600'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See how your preferences will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat(preferences.locale, {
                    style: 'currency',
                    currency: preferences.currency,
                  }).format(9479.92)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Today&apos;s Date:</span>
                <span className="font-semibold">
                  {(() => {
                    const now = new Date()
                    const day = now.getDate().toString().padStart(2, '0')
                    const month = (now.getMonth() + 1).toString().padStart(2, '0')
                    const year = now.getFullYear()
                    const shortYear = year.toString().slice(-2)
                    
                    if (preferences.dateFormat === 'dd/MM/yyyy') return `${day}/${month}/${year}`
                    if (preferences.dateFormat === 'dd/MM/yy') return `${day}/${month}/${shortYear}`
                    if (preferences.dateFormat === 'MM/dd/yyyy') return `${month}/${day}/${year}`
                    if (preferences.dateFormat === 'MM/dd/yy') return `${month}/${day}/${shortYear}`
                    return `${day}/${month}/${shortYear}`
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Large Number:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat(preferences.locale, {
                    style: 'currency',
                    currency: preferences.currency,
                  }).format(1234567.89)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
