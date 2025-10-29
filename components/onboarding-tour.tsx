'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  icon: string
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to CashFlow!',
    description: 'Let\'s take a quick tour to help you get started with managing your finances. You can skip this tour anytime.',
    icon: '👋'
  },
  {
    title: 'Create Your First Account',
    description: 'Start by adding your bank accounts, credit cards, or cash. This helps you track all your money in one place. Go to Accounts and click "Create Account".',
    icon: '🏦'
  },
  {
    title: 'Add Transactions',
    description: 'Record your income and expenses to see where your money goes. You can add one-time transactions or set up recurring ones for bills and paychecks.',
    icon: '💸'
  },
  {
    title: 'Set Up Recurring Transactions',
    description: 'For regular income (like salary) or expenses (like rent), enable "Recurring" when creating a transaction. Choose how often it repeats.',
    icon: '🔄'
  },
  {
    title: 'Track Your Loans',
    description: 'Manage mortgages, car loans, student loans, or any debt. CashFlow helps you track payments, interest, and payoff dates.',
    icon: '🏠'
  },
  {
    title: 'Create Budgets',
    description: 'Set spending limits for different categories to control your expenses. Get alerts when you\'re close to your budget limit.',
    icon: '📊'
  },
  {
    title: 'Monitor Your Progress',
    description: 'Check your dashboard anytime to see your financial overview, upcoming payments, and spending trends. You\'re all set!',
    icon: '📈'
  }
]

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl relative">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close tour"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4">{step.icon}</div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {isFirstStep && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1"
              >
                Skip Tour
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
