-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "principal" REAL NOT NULL,
    "currentBalance" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "monthlyPayment" REAL NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "lender" TEXT,
    "accountNumber" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaidOff" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "paymentFrequency" TEXT,
    "numberOfPayments" INTEGER,
    "feeAmount" REAL,
    "allowSplitPayment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("accountNumber", "allowSplitPayment", "color", "createdAt", "currentBalance", "endDate", "feeAmount", "id", "interestRate", "isActive", "isPaidOff", "lender", "monthlyPayment", "name", "notes", "numberOfPayments", "paymentDay", "paymentFrequency", "principal", "startDate", "termMonths", "type", "updatedAt", "userId") SELECT "accountNumber", "allowSplitPayment", "color", "createdAt", "currentBalance", "endDate", "feeAmount", "id", "interestRate", "isActive", "isPaidOff", "lender", "monthlyPayment", "name", "notes", "numberOfPayments", "paymentDay", "paymentFrequency", "principal", "startDate", "termMonths", "type", "updatedAt", "userId" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE INDEX "Loan_userId_isActive_idx" ON "Loan"("userId", "isActive");
CREATE INDEX "Loan_userId_paymentDay_idx" ON "Loan"("userId", "paymentDay");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "notes" TEXT,
    "bonusAmount" REAL,
    "includeBonusNext" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "bonusAmount", "categoryId", "createdAt", "date", "description", "id", "includeBonusNext", "isRecurring", "notes", "recurrence", "type", "updatedAt", "userId") SELECT "accountId", "amount", "bonusAmount", "categoryId", "createdAt", "date", "description", "id", "includeBonusNext", "isRecurring", "notes", "recurrence", "type", "updatedAt", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
