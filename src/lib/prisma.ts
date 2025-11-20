import { PrismaClient } from '@prisma/client'
import { Pool, PoolConfig } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Optimal Prisma Client Configuration for Supabase
 * 
 * Best Practices:
 * - Development: Use DIRECT connection (port 5432) with SSL
 * - Production: Use CONNECTION POOLER (port 6543) with ?pgbouncer=true
 * 
 * Connection String Formats:
 * - Direct: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
 * - Pooler: postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL || ''
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Check if using connection pooler (port 6543 or pooler.supabase.com)
  const isPooler = databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes(':6543')
  
  // Auto-fix common issues
  let url = databaseUrl
  
  if (isPooler && !url.includes('pgbouncer=true')) {
    // Add pgbouncer=true for connection pooler to disable prepared statements
    url = `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`
  }
  
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
  
  // Build Pool configuration with explicit SSL settings
  // The ssl object MUST be provided to override any default SSL behavior
  const poolConfig: PoolConfig = {
    connectionString: cleanConnectionString,
    // SSL configuration - REQUIRED and MUST be explicitly set for Supabase
    // Setting rejectUnauthorized: false accepts Supabase's self-signed certificates
    // This is safe because we're connecting to Supabase's trusted infrastructure
    ssl: {
      rejectUnauthorized: false,
    },
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    connectionTimeoutMillis: 10000, // 10 seconds connection timeout
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
  }
  
  // Create pool with explicit SSL configuration
  const pool = new Pool(poolConfig)
  
  // Verify SSL config is set (for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 SSL Configuration:', pool.options.ssl ? 'Enabled' : 'Disabled')
  }
  
  return pool
}

// Create PostgreSQL connection pool with proper SSL configuration
const pool = createSupabasePool()
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

// Log connection info in development
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('✅ PostgreSQL connection established')
  })
  
  pool.on('acquire', () => {
    console.log('📊 PostgreSQL connection acquired from pool')
  })
}
