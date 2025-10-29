'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface SessionTimeoutWarningProps {
  onStayLoggedIn: () => void
  onLogout: () => void
}

export function SessionTimeoutWarning({ onStayLoggedIn, onLogout }: SessionTimeoutWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Session Timeout Warning</CardTitle>
          <CardDescription className="text-base mt-2">
            You've been inactive for a while. For your security, you'll be logged out in 1 minute.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex-1"
            >
              Logout Now
            </Button>
            <Button
              onClick={onStayLoggedIn}
              className="flex-1"
            >
              Stay Logged In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
