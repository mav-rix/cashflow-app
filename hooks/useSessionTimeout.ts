'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onWarning?: () => void
  onTimeout?: () => void
}

export function useSessionTimeout({
  timeoutMinutes = 15,
  warningMinutes = 1,
  onWarning,
  onTimeout,
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const warningTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/auth/signin?timeout=true')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/signin?timeout=true')
    }
  }

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Hide warning if shown
    setShowWarning(false)

    // Set warning timer (1 minute before timeout)
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
      onWarning?.()
    }, warningTime)

    // Set actual timeout timer
    const timeoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      logout()
      onTimeout?.()
    }, timeoutTime)
  }

  const stayLoggedIn = () => {
    setShowWarning(false)
    resetTimer()
  }

  useEffect(() => {
    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer()
    }

    // Start initial timer
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [timeoutMinutes, warningMinutes])

  return {
    showWarning,
    stayLoggedIn,
    logout,
  }
}
