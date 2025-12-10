import { PrismaClient } from '@prisma/client'
import { Pool, PoolConfig } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Optimal Prisma Client Configuration for Supabase
 * 
 * ⚠️ IMPORTANT: For serverless/Next.js environments, use CONNECTION POOLER (port 6543)
 * Direct connections (port 5432) can cause DbHandler termination and connection timeouts
 * 
 * Best Practices:
 * - Production/Serverless: Use CONNECTION POOLER (port 6543) with ?pgbouncer=true ✅ RECOMMENDED
 * - Development: Can use DIRECT (port 5432) but pooler is more stable
 * 
 * Connection String Formats:
 * - Direct: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
 * - Pooler: postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
 * 
 * To get your pooler URL:
 * 1. Go to Supabase Dashboard → Settings → Database
 * 2. Click "Session mode" tab (NOT Transaction mode)
 * 3. Copy the connection string
 * 4. Add ?pgbouncer=true if not present
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL || ''
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Check if using connection pooler (port 6543 or pooler.supabase.com)
  const isPooler = databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')
  const isDirect = databaseUrl.includes(':5432') && !isPooler
  
  // Auto-fix common issues
  let url = databaseUrl
  
  if (isPooler && !url.includes('pgbouncer=true')) {
    // Add pgbouncer=true for connection pooler to disable prepared statements
    url = `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`
  }
  
  // Warn if using direct connection (can cause issues in serverless)
  if (isDirect) {
    console.warn('⚠️  WARNING: Using DIRECT connection (port 5432)')
    console.warn('⚠️  Direct connections can cause DbHandler termination and timeouts in serverless environments')
    console.warn('⚠️  RECOMMENDED: Switch to CONNECTION POOLER (port 6543)')
    console.warn('⚠️  Get pooler URL: Supabase Dashboard → Settings → Database → Session mode')
  }
  
  // Debug logging removed for cleaner output
  
  return url
}

/**
 * Creates a properly configured PostgreSQL Pool for Supabase
 * Handles SSL/TLS configuration correctly for both direct and pooler connections
 * 
 * Based on Supabase documentation: https://supabase.com/docs/guides/database/connecting-to-postgres
 * 
 * IMPORTANT: Supabase requires SSL connections. We configure SSL explicitly to handle
 * self-signed certificates properly. The pg library requires explicit SSL configuration
 * when using connectionString to override any SSL settings in the URL.
 */
function createSupabasePool(): Pool {
  const databaseUrl = getDatabaseUrl()
  
  // Check if this is a Supabase connection
  const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com')
  
  if (!isSupabase) {
    // For non-Supabase connections, use connection string as-is
    return new Pool({ connectionString: databaseUrl })
  }
  
  // For Supabase, we MUST configure SSL explicitly
  // Remove sslmode from connection string to avoid conflicts with explicit SSL config
  let cleanConnectionString = databaseUrl
  // Remove all sslmode parameters (sslmode=require, sslmode=prefer, etc.)
  cleanConnectionString = cleanConnectionString.replace(/[?&]sslmode=[^&]*/g, '')
  // Clean up any double ? or & characters
  cleanConnectionString = cleanConnectionString.replace(/\?&/g, '?').replace(/&&/g, '&')
  
  // Check if using pooler for optimized settings
  const isPooler = cleanConnectionString.includes('pooler.supabase.com') || cleanConnectionString.includes(':6543')
  
  // Detect if running on localhost (development)
  const isLocalhost = process.env.NODE_ENV === 'development' && !process.env.VERCEL
  
  // Build Pool configuration with explicit SSL settings
  // The ssl object MUST be provided to override any default SSL behavior
  // Conservative values for serverless / Prisma v7 environments
  const poolConfig: PoolConfig = {
    connectionString: cleanConnectionString,
    // SSL configuration - REQUIRED and MUST be explicitly set for Supabase
    // Setting rejectUnauthorized: false accepts Supabase's self-signed certificates
    // This is safe because we're connecting to Supabase's trusted infrastructure
    ssl: {
      rejectUnauthorized: false,
    },
    // Connection pool settings - conservative values for serverless/Prisma v7
    // If using pooler, allow slightly higher max; otherwise keep very low
    // For localhost, increase limits to handle connection issues better
    max: isPooler ? (isLocalhost ? 10 : 5) : (isLocalhost ? 5 : 2), // More connections for localhost
    connectionTimeoutMillis: isLocalhost ? 60000 : 30000, // Longer timeout for localhost (60s)
    idleTimeoutMillis: isPooler ? (isLocalhost ? 60000 : 30000) : (isLocalhost ? 120000 : 60000), // Longer idle for localhost
  }
  
  // Create pool with explicit SSL configuration
  const pool = new Pool(poolConfig)
  
  // SSL configuration verified (logging removed)
  
  return pool
}

// Create PostgreSQL connection pool with proper SSL configuration
const pool = createSupabasePool()
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error'], // Only log errors
  })

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown - properly close both Prisma client and connection pool
if (typeof window === 'undefined') {
  const cleanup = async () => {
    try {
      await prisma.$disconnect()
      await pool.end()
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }
  
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})

// Connection logging removed for cleaner output
