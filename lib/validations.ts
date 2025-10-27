import { z } from 'zod'

// Frontend validation schema with confirmPassword
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Backend validation schema without confirmPassword
export const signUpAPISchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['checking', 'savings', 'credit_card', 'cash', 'investment']),
  balance: z.number().default(0),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  color: z.string().optional(),
})

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  description: z.string().optional(),
  date: z.date().default(new Date()),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
})

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly']),
  startDate: z.date(),
  endDate: z.date().optional(),
  categoryId: z.string().optional(),
  alertAt: z.number().min(0).max(100).optional(),
})

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0).default(0),
  deadline: z.date().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

export const loanSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  type: z.enum(['mortgage', 'auto', 'student', 'personal', 'credit_card', 'payday', 'bnpl', 'other']),
  principal: z.number().positive('Principal amount must be positive'),
  currentBalance: z.number().min(0, 'Balance cannot be negative'),
  interestRate: z.number().min(0).max(100, 'Interest rate must be between 0 and 100'),
  termMonths: z.number().int().positive('Term must be a positive number of months'),
  startDate: z.date(),
  monthlyPayment: z.number().positive('Monthly payment must be positive'),
  paymentDay: z.number().int().min(1).max(31, 'Payment day must be between 1 and 31'),
  lender: z.string().optional(),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
  // BNPL and Payday loan specific fields
  paymentFrequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  numberOfPayments: z.number().int().positive().optional(),
  feeAmount: z.number().min(0).optional(),
  allowSplitPayment: z.boolean().optional(),
})

export const loanPaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  dueDate: z.date(),
  paymentDate: z.date().optional(),
  amount: z.number().positive('Payment amount must be positive'),
  principal: z.number().optional(),
  interest: z.number().optional(),
  status: z.enum(['pending', 'paid', 'late', 'missed']).default('pending'),
  notes: z.string().optional(),
  transactionId: z.string().optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type AccountInput = z.infer<typeof accountSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type LoanInput = z.infer<typeof loanSchema>
export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>
