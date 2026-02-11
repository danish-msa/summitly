export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // NextAuth.js
  auth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  // API Keys
  api: {
    repliers: process.env.NEXT_PUBLIC_REPLIERS_API_KEY || '',
    googleMaps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  
  // Email Service
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    contact: process.env.CONTACT_EMAIL || process.env.SMTP_USER || '',
  },
  
  // Stripe (optional)
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // App
  app: {
    env: process.env.NODE_ENV || 'development',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
} as const
