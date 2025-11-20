import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Optimal Prisma Client Configuration for Supabase
 * 
 * Best Practices:
 * - Development: Use DIRECT connection (port 5432) with ?sslmode=require
 * - Production: Use CONNECTION POOLER (port 6543) with ?pgbouncer=true
 * 
 * Connection String Formats:
 * - Direct: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
 * - Pooler: postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL || ''
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Check if using connection pooler (port 6543 or pooler.supabase.com)
  const isPooler = databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')
  
  // Check if using direct connection (port 5432)
  const isDirect = databaseUrl.includes(':5432') || databaseUrl.includes('db.') && !databaseUrl.includes('pooler')
  
  // Auto-fix common issues
  let url = databaseUrl
  
  if (isPooler && !url.includes('pgbouncer=true')) {
    // Add pgbouncer=true for connection pooler to disable prepared statements
    url = `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`
  }
  
  if (isDirect && !url.includes('sslmode=')) {
    // Add SSL requirement for direct connections
    url = `${url}${url.includes('?') ? '&' : '?'}sslmode=require`
  }
  
  return url
}

// Create PostgreSQL connection pool
const databaseUrl = getDatabaseUrl()
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  })

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof window === 'undefined') {
  const cleanup = async () => {
    await prisma.$disconnect()
  }
  
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}
