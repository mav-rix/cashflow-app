'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { setUserPreferences } from '@/lib/utils'

interface Preferences {
  currency: string
  dateFormat: string
  locale: string
  statsPeriod: 'weekly' | 'biweekly' | 'monthly'
}

interface PreferencesContextType {
  preferences: Preferences
  setPreferences: (prefs: Preferences) => void
  refreshPreferences: () => Promise<void>
  loading: boolean
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPrefs] = useState<Preferences>({
    currency: 'AUD',
    dateFormat: 'dd/MM/yy',
    locale: 'en-AU',
    statsPeriod: 'monthly',
  })
  const [loading, setLoading] = useState(true)

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const userPrefs = data.preferences
        setPrefs(userPrefs)
        setUserPreferences(userPrefs)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch user preferences on mount
    fetchPreferences()
  }, [])

  const updatePreferences = (prefs: Preferences) => {
    setPrefs(prefs)
    setUserPreferences(prefs)
  }

  const refreshPreferences = async () => {
    await fetchPreferences()
  }

  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      setPreferences: updatePreferences, 
      refreshPreferences,
      loading 
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
