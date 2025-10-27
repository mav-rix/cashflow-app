import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface UserPreferences {
  currency?: string
  locale?: string
  dateFormat?: string
}

// Global preferences (can be overridden by context)
let globalPreferences: UserPreferences = {
  currency: 'AUD',
  locale: 'en-AU',
  dateFormat: 'dd/MM/yyyy'
}

export function setUserPreferences(prefs: UserPreferences) {
  globalPreferences = { ...globalPreferences, ...prefs }
}

export function getUserPreferences(): UserPreferences {
  return globalPreferences
}

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || globalPreferences.currency || 'AUD'
  const locale = globalPreferences.locale || 'en-AU'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
  }).format(amount)
}

export function formatDate(date: Date | string, format?: string): string {
  const d = new Date(date)
  const dateFormat = format || globalPreferences.dateFormat || 'dd/MM/yyyy'
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const shortYear = year.toString().slice(-2)
  
  if (dateFormat === 'dd/MM/yyyy') {
    return `${day}/${month}/${year}`
  } else if (dateFormat === 'dd/MM/yy') {
    return `${day}/${month}/${shortYear}`
  } else if (dateFormat === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`
  } else if (dateFormat === 'MM/dd/yy') {
    return `${month}/${day}/${shortYear}`
  }
  
  // Default fallback
  return `${day}/${month}/${shortYear}`
}

export function formatDateTime(date: Date | string): string {
  const locale = globalPreferences.locale || 'en-AU'
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateLong(date: Date | string): string {
  const locale = globalPreferences.locale || 'en-AU'
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
