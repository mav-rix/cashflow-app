# 💰 CashFlow - Smart Budget Management App

A modern, full-featured budgeting application built with Next.js 16, TypeScript, and Prisma. Track expenses, manage budgets, and achieve your financial goals.

## ✨ Features

- **User Authentication** - Secure sign up and sign in with encrypted passwords
- **Multi-Account Management** - Track checking, savings, credit cards, and investment accounts
- **Transaction Tracking** - Record income and expenses with detailed categorization
- **Budget Planning** - Set monthly/yearly budgets with customizable alerts
- **Financial Goals** - Create and track savings goals with deadlines
- **Visual Analytics** - Beautiful charts and insights (coming soon)
- **Recurring Transactions** - Automated tracking for subscriptions and bills
- **Category Management** - Pre-built and custom categories with icons
- **Multi-Currency Support** - Support for different currencies
- **Export Reports** - Generate and export financial reports (coming soon)

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma
- **Authentication**: Custom JWT-based auth (upgradeable to NextAuth.js)
- **UI Components**: Custom components with shadcn/ui inspiration
- **Charts**: Recharts (ready to integrate)
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ (Note: Next.js 16 requires Node 20+, but works with warnings on Node 18)
- npm or yarn or pnpm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd /home/eric/Projects/cashflow
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   # Already created in .env file
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed default categories**
   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
cashflow/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── auth/                 # Authentication endpoints
│   ├── auth/                     # Auth pages (signin, signup)
│   ├── dashboard/                # Dashboard page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility functions
│   ├── auth.ts                   # Password hashing utilities
│   ├── prisma.ts                 # Prisma client instance
│   ├── utils.ts                  # Helper functions
│   └── validations.ts            # Zod schemas
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seed data
└── public/                       # Static assets
```

## 🗄️ Database Schema

The app includes the following models:

- **User** - User accounts with authentication
- **Account** - Financial accounts (checking, savings, etc.)
- **Transaction** - Income and expense records
- **Category** - Transaction categories with icons
- **Budget** - Budget limits per category
- **Goal** - Financial savings goals

## 🎯 Usage

1. **Sign Up** - Create a new account at `/auth/signup`
2. **Sign In** - Log in at `/auth/signin`
3. **Dashboard** - View your financial overview
4. **Add Accounts** - Create accounts for different banks/cards
5. **Track Transactions** - Record income and expenses
6. **Set Budgets** - Create spending limits
7. **Monitor Goals** - Track your savings progress

## 🔜 Coming Soon

- [ ] Full transaction CRUD operations
- [ ] Interactive charts and analytics
- [ ] Budget alerts and notifications
- [ ] PDF/CSV export functionality
- [ ] Mobile app (React Native)
- [ ] Bank account integration
- [ ] Bill reminders
- [ ] Advanced filtering and search
- [ ] Dark mode
- [ ] Multi-language support

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Database Migration (PostgreSQL)

For production, switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env` with PostgreSQL URL:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Built with ❤️ for better financial management

---

**Note**: This is a development version. For production use, please:
- Upgrade to Node.js 20+
- Use a production database (PostgreSQL)
- Implement proper session management
- Add rate limiting
- Enable HTTPS
- Add proper error tracking
- Implement comprehensive testing
