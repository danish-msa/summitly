# Core Dependencies Setup

This document outlines the core dependencies that have been installed and configured for the real estate platform.

## ✅ Installed Dependencies

### 1. **NextAuth.js** - Authentication
- **Package**: `next-auth`, `@auth/prisma-adapter`
- **Configuration**: `src/lib/auth.ts`
- **API Route**: `src/app/api/auth/[...nextauth]/route.ts`
- **Features**:
  - Google OAuth integration
  - Credentials-based authentication
  - JWT session strategy
  - Prisma adapter for database integration

### 2. **Prisma** - Database ORM
- **Package**: `prisma`, `@prisma/client`
- **Schema**: `prisma/schema.prisma`
- **Client**: `src/lib/prisma.ts`
- **Features**:
  - PostgreSQL database support
  - Complete user and property models
  - Authentication tables (Account, Session, VerificationToken)
  - Property management with favorites and views
  - Agent profiles and contact forms

### 3. **Zod** - Validation
- **Package**: `zod`
- **Schemas**: `src/lib/validations/`
- **Features**:
  - Form validation schemas
  - Type-safe validation
  - Authentication forms
  - Property forms
  - Contact forms

### 4. **React Hook Form** - Form Management
- **Package**: `react-hook-form`, `@hookform/resolvers`
- **Integration**: Works with Zod schemas
- **Features**:
  - Form state management
  - Validation integration
  - Performance optimization

### 5. **Zustand** - State Management
- **Package**: `zustand`
- **Stores**: `src/lib/stores/`
- **Features**:
  - Authentication state
  - Property state management
  - Favorites management
  - Search filters

### 6. **React Query (TanStack Query)** - Data Fetching
- **Package**: `@tanstack/react-query`, `@tanstack/react-query-devtools`
- **Configuration**: `src/lib/query-client.ts`
- **Provider**: `src/components/providers/QueryProvider.tsx`
- **Features**:
  - Server state management
  - Caching and synchronization
  - Background updates
  - DevTools integration

### 7. **Nodemailer** - Email Service
- **Package**: `nodemailer`, `@types/nodemailer`
- **Configuration**: `src/lib/email.ts`
- **Features**:
  - SMTP email sending
  - Contact form emails
  - Property inquiry emails
  - Template support

### 8. **bcryptjs** - Password Hashing
- **Package**: `bcryptjs`, `@types/bcryptjs`
- **Usage**: Password hashing in authentication
- **Features**:
  - Secure password hashing
  - Salt generation
  - Password verification

## 🔧 Configuration Files

### Environment Variables
Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/realestate_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# API Keys
NEXT_PUBLIC_REPLIERS_API_KEY="your_repliers_api_key_here"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
CONTACT_EMAIL="contact@yourdomain.com"
```

### Database Setup
1. Set up a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env.local`
3. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## 🚀 Usage Examples

### Authentication
```typescript
import { useSession, signIn, signOut } from 'next-auth/react'

// Check authentication status
const { data: session, status } = useSession()

// Sign in
await signIn('google')

// Sign out
await signOut()
```

### Database Operations
```typescript
import { prisma } from '@/lib/prisma'

// Create a property
const property = await prisma.property.create({
  data: {
    title: 'Beautiful Home',
    price: 500000,
    // ... other fields
  }
})
```

### Form Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema } from '@/lib/validations/auth'

const form = useForm({
  resolver: zodResolver(signUpSchema),
})
```

### State Management
```typescript
import { useAuthStore } from '@/lib/stores/auth'
import { usePropertyStore } from '@/lib/stores/property'

// Authentication state
const { user, isAuthenticated } = useAuthStore()

// Property state
const { properties, addToFavorites } = usePropertyStore()
```

### Data Fetching
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['properties'],
  queryFn: () => fetchProperties(),
})
```

## 📁 File Structure

```
src/
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client
│   ├── config.ts            # Environment configuration
│   ├── email.ts             # Email service
│   ├── query-client.ts      # React Query configuration
│   ├── stores/              # Zustand stores
│   │   ├── auth.ts
│   │   └── property.ts
│   └── validations/         # Zod schemas
│       ├── auth.ts
│       └── property.ts
├── components/
│   └── providers/           # React providers
│       ├── QueryProvider.tsx
│       └── SessionProvider.tsx
└── app/
    └── api/
        └── auth/
            └── [...nextauth]/
                └── route.ts
```

## 🔄 Next Steps

1. **Set up environment variables** in `.env.local`
2. **Configure database** and run migrations
3. **Set up Google OAuth** credentials
4. **Configure email service** (Gmail, SendGrid, etc.)
5. **Test authentication flow**
6. **Implement property CRUD operations**
7. **Add form components** with validation
8. **Set up email templates**

## 🛠️ Development Commands

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

All core dependencies are now properly installed and configured according to the PRD specifications!

