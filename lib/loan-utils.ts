// Loan calculation utilities

export interface PaymentScheduleItem {
  paymentNumber: number;
  dueDate: Date;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate monthly payment for a loan using the amortization formula
 * P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment * 100) / 100;
}

/**
 * Generate full amortization schedule for a loan
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date,
  paymentDay: number
): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = [];
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 100 / 12;
  
  let balance = principal;
  let currentDate = new Date(startDate);
  
  for (let i = 1; i <= termMonths; i++) {
    // Calculate next payment date
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + (i === 1 ? 0 : 1));
    nextMonth.setDate(Math.min(paymentDay, getDaysInMonth(nextMonth)));
    
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      paymentNumber: i,
      dueDate: nextMonth,
      payment: monthlyPayment,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  
  return schedule;
}

/**
 * Calculate payoff date based on current balance and payment
 */
export function calculatePayoffDate(
  currentBalance: number,
  annualRate: number,
  monthlyPayment: number,
  currentDate: Date = new Date()
): Date {
  if (monthlyPayment <= 0) {
    throw new Error('Monthly payment must be greater than 0');
  }
  
  const monthlyRate = annualRate / 100 / 12;
  let balance = currentBalance;
  let months = 0;
  const maxMonths = 600; // 50 years max
  
  while (balance > 0 && months < maxMonths) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    
    if (principal <= 0) {
      throw new Error('Payment is too low to cover interest');
    }
    
    balance -= principal;
    months++;
  }
  
  const payoffDate = new Date(currentDate);
  payoffDate.setMonth(payoffDate.getMonth() + months);
  
  return payoffDate;
}

/**
 * Calculate total interest paid over life of loan
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPaid = monthlyPayment * termMonths;
  return Math.round((totalPaid - principal) * 100) / 100;
}

/**
 * Get next payment due date
 */
export function getNextPaymentDate(
  paymentDay: number,
  currentDate: Date = new Date()
): Date {
  const nextPayment = new Date(currentDate);
  nextPayment.setDate(paymentDay);
  
  // If payment day has passed this month, move to next month
  if (nextPayment <= currentDate) {
    nextPayment.setMonth(nextPayment.getMonth() + 1);
  }
  
  // Adjust for months with fewer days
  if (nextPayment.getDate() !== paymentDay) {
    nextPayment.setDate(0); // Last day of previous month
  }
  
  return nextPayment;
}

/**
 * Helper to get days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Calculate how much earlier loan will be paid off with extra payments
 */
export function calculateExtraPaymentImpact(
  currentBalance: number,
  annualRate: number,
  regularPayment: number,
  extraPayment: number
): {
  monthsSaved: number;
  interestSaved: number;
  newPayoffDate: Date;
} {
  const regularPayoffDate = calculatePayoffDate(currentBalance, annualRate, regularPayment);
  const newPayoffDate = calculatePayoffDate(currentBalance, annualRate, regularPayment + extraPayment);
  
  const monthsOriginal = Math.ceil((regularPayoffDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  const monthsNew = Math.ceil((newPayoffDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  
  // Calculate interest saved
  const originalInterest = (regularPayment * monthsOriginal) - currentBalance;
  const newInterest = ((regularPayment + extraPayment) * monthsNew) - currentBalance;
  
  return {
    monthsSaved: monthsOriginal - monthsNew,
    interestSaved: Math.round((originalInterest - newInterest) * 100) / 100,
    newPayoffDate,
  };
}
