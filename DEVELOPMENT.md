# CashFlow - Development Documentation

## Project Overview

CashFlow is a comprehensive budgeting application designed to help users manage their finances effectively. Built with modern web technologies, it provides a scalable foundation that can be extended to mobile platforms.

## Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **Components**: Custom UI components inspired by shadcn/ui
- **State Management**: React hooks and Context API (can be extended with Zustand/Redux)

### Backend Architecture
- **API**: Next.js API Routes (serverless functions)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: Custom JWT-based system (upgradeable to NextAuth.js v5)
- **Validation**: Zod for runtime type validation

### Database Design

#### Core Entities
1. **User** - Authentication and user profile
   - Stores hashed passwords using bcryptjs
   - Supports multiple currencies
   - Links to all user data

2. **Account** - Financial accounts
   - Multiple account types: checking, savings, credit cards, etc.
   - Track balances per account
   - Soft delete with isActive flag

3. **Transaction** - Income and expense records
   - Categorized transactions
   - Support for recurring transactions
   - Date-indexed for performance

4. **Category** - Transaction categories
   - Pre-seeded default categories
   - User-created custom categories
   - Icons and colors for visual identification

5. **Budget** - Budget limits
   - Period-based (monthly/yearly)
   - Category-specific budgets
   - Alert thresholds for notifications

6. **Goal** - Savings goals
   - Target amounts and deadlines
   - Progress tracking
   - Visual indicators

## Key Features

### Implemented ✅
- User registration and authentication
- Landing page with feature showcase
- Dashboard with financial overview
- Database schema and migrations
- Default categories with icons
- Basic UI components
- Responsive design

### In Progress 🚧
- Transaction CRUD operations
- Account management
- Budget tracking UI

### Planned 📋
- Visual analytics with charts
- Budget alerts and notifications
- Recurring transaction automation
- Goal progress tracking
- Data export (CSV/PDF)
- Dark mode
- Mobile app (React Native)

## File Structure

```
cashflow/
├── app/
│   ├── api/              # API endpoints
│   │   └── auth/         # Authentication routes
│   │       ├── signin/
│   │       ├── signup/
│   │       └── signout/
│   ├── auth/             # Auth pages
│   │   ├── signin/
│   │   └── signup/
│   ├── dashboard/        # Dashboard page
│   ├── transactions/     # Transactions page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   └── ui/               # Reusable components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   ├── auth.ts           # Password utilities
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed data
│   └── dev.db            # SQLite database
└── public/               # Static assets
```

## Development Workflow

### Local Development
```bash
npm run dev              # Start dev server
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

### Database Management
```bash
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema to DB
npx prisma migrate dev   # Create migration
npx prisma studio        # Visual DB editor
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Future Endpoints
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create account
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal

## Security Considerations

### Current Implementation
- Passwords hashed with bcryptjs (12 rounds)
- HTTP-only cookies for session management
- Input validation with Zod
- SQL injection protection via Prisma

### Production Recommendations
- Implement rate limiting
- Add CSRF protection
- Enable HTTPS only
- Use environment-specific secrets
- Implement proper session management
- Add request logging and monitoring
- Set up error tracking (Sentry)
- Implement data backup strategy

## Performance Optimization

### Database
- Indexed fields: userId, date, categoryId
- Efficient queries with Prisma
- Connection pooling for production

### Frontend
- Server-side rendering with Next.js
- Image optimization
- Code splitting
- Lazy loading for charts

## Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables
3. Deploy with one click
4. Automatic HTTPS and CDN

### Environment Variables
```bash
DATABASE_URL=              # PostgreSQL connection string
NEXTAUTH_URL=             # App URL
NEXTAUTH_SECRET=          # Secret key (openssl rand -base64 32)
```

## Testing Strategy

### Unit Tests (To Implement)
- API route handlers
- Utility functions
- Validation schemas

### Integration Tests (To Implement)
- Authentication flow
- CRUD operations
- Database operations

### E2E Tests (To Implement)
- User registration and login
- Transaction creation
- Budget management

## Mobile App Strategy

### React Native Integration
1. Shared API endpoints
2. Separate mobile repository
3. Shared TypeScript types
4. Similar UI components
5. Platform-specific features

### Progressive Web App (PWA)
- Installable on mobile devices
- Offline support
- Push notifications
- Native-like experience

## Contribution Guidelines

1. Follow TypeScript best practices
2. Use Prettier for formatting
3. Write meaningful commit messages
4. Test before committing
5. Document complex logic
6. Update this doc when adding features

## Common Tasks

### Adding a New Page
1. Create page in `app/[route]/page.tsx`
2. Add navigation link
3. Create API routes if needed
4. Add to sitemap

### Adding a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update TypeScript types
4. Create API routes
5. Build UI components

### Adding a New Feature
1. Plan the feature structure
2. Update database schema if needed
3. Create API endpoints
4. Build UI components
5. Add validation
6. Test thoroughly
7. Document

## Known Issues

1. **Node.js Version Warning**: Next.js 16 requires Node 20+, currently running on Node 18
   - Solution: Upgrade to Node 20 LTS
   - Workaround: App works with warnings

2. **NextAuth Compatibility**: NextAuth v4 doesn't support Next.js 16
   - Solution: Custom auth implementation (current)
   - Future: Upgrade to Auth.js v5 when stable

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

## Support

For issues, questions, or contributions:
- Create GitHub issues
- Check documentation
- Review existing code
- Follow best practices

---

Last Updated: October 26, 2025
