# 🚀 Quick Start Guide - CashFlow

## ⚠️ Important: Node.js Requirement

Before starting, you need **Node.js 20+**. You currently have **Node.js 18**.

### Upgrade Node.js First

**Recommended: Use NVM**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

See `NODE_UPGRADE.md` for more options.

---

## After Node.js Upgrade

### Option 1: Automated Setup (Recommended)

```bash
cd /home/eric/Projects/cashflow
./setup.sh
npm run dev
```

### Option 2: Manual Setup

```bash
cd /home/eric/Projects/cashflow

# Install dependencies
npm install --legacy-peer-deps

# Setup database
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

---

## Access the App

Open your browser and visit:
**http://localhost:3000**

---

## What You'll See

1. **Landing Page** (`/`)
   - Beautiful homepage with features
   - Sign In and Sign Up buttons

2. **Sign Up** (`/auth/signup`)
   - Create your account
   - Email and password required

3. **Sign In** (`/auth/signin`)
   - Log in to your account

4. **Dashboard** (`/dashboard`)
   - Financial overview
   - Stats and quick actions

5. **Transactions** (`/transactions`)
   - View transactions (placeholder)

---

## First Steps in the App

1. **Create Account**
   - Click "Get Started" on homepage
   - Fill in name, email, password
   - Click "Sign Up"

2. **Sign In**
   - Enter your email and password
   - Click "Sign In"

3. **Explore Dashboard**
   - View financial stats
   - Navigate different sections

4. **Check Transactions**
   - Click "Transactions" in navigation
   - See transaction interface

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Apply schema changes
npm run db:seed          # Seed default categories
npm run db:studio        # Open database GUI

# Code Quality
npm run lint             # Run ESLint
```

---

## Database Management

### View Database with Prisma Studio

```bash
npm run db:studio
```

This opens a visual database editor at `http://localhost:5555`

You can:
- View all tables
- See your users
- Check categories
- Manage data visually

---

## Project Structure Overview

```
cashflow/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Dashboard
│   ├── auth/signin/          # Sign in page
│   ├── auth/signup/          # Sign up page
│   └── api/auth/             # Auth API routes
├── components/ui/            # UI components
├── lib/                      # Utilities
└── prisma/                   # Database
```

---

## Common Issues

### Issue: "Node.js version required"
**Solution**: Upgrade to Node.js 20+ (see top of this file)

### Issue: Dependencies won't install
```bash
npm install --legacy-peer-deps
```

### Issue: Database errors
```bash
rm prisma/dev.db
npx prisma db push
npm run db:seed
```

### Issue: Port 3000 already in use
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Or use different port
npm run dev -- -p 3001
```

---

## What's Included

✅ User authentication (sign up, sign in, sign out)
✅ Beautiful landing page
✅ Dashboard with stats
✅ Database with 6 models (User, Account, Transaction, Category, Budget, Goal)
✅ 16 default categories with icons
✅ Responsive design
✅ TypeScript everywhere
✅ Tailwind CSS styling

---

## Next Development Steps

After getting the app running, you can:

1. **Add Transaction CRUD**
   - Create API routes for transactions
   - Build transaction forms
   - Implement list/edit/delete

2. **Add Account Management**
   - Create/edit/delete accounts
   - View account balances
   - Transfer between accounts

3. **Implement Budgets**
   - Create budget UI
   - Track spending vs budget
   - Add budget alerts

4. **Build Analytics**
   - Integrate Recharts
   - Create spending charts
   - Add monthly reports

---

## Documentation

- **README.md** - Project overview
- **PROJECT_SUMMARY.md** - What's been built
- **DEVELOPMENT.md** - Development guide
- **NODE_UPGRADE.md** - Node.js upgrade instructions
- **This file** - Quick start guide

---

## Getting Help

1. Check documentation files
2. Review error messages carefully
3. Ensure Node.js 20+ is installed
4. Check that all dependencies are installed
5. Verify database is set up correctly

---

## Success Checklist

Before you can run the app:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] Dependencies installed (`npm install --legacy-peer-deps`)
- [ ] Database created (`npx prisma db push`)
- [ ] Categories seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open to `http://localhost:3000`

---

**You're all set! Happy coding! 💰**
