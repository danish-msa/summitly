import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint to diagnose database and environment issues
 * Access at: /api/health
 */
export async function GET() {
  const health: {
    status: 'healthy' | 'unhealthy'
    timestamp: string
    database: {
      connected: boolean
      error?: string
    }
    environment: {
      hasDatabaseUrl: boolean
      hasS3AccessKey: boolean
      hasS3SecretKey: boolean
      hasS3Region: boolean
      hasS3Bucket: boolean
      nodeEnv: string
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
    },
    environment: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasS3AccessKey: !!(process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID),
      hasS3SecretKey: !!(process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY),
      hasS3Region: !!(process.env.S3_REGION || process.env.AWS_REGION),
      hasS3Bucket: !!(process.env.S3_BUCKET || process.env.AWS_S3_BUCKET),
      nodeEnv: process.env.NODE_ENV || 'unknown',
    },
  }

  // Test database connection
  try {
    await prisma.$connect()
    // Try a simple query
    await prisma.$queryRaw`SELECT 1`
    health.database.connected = true
  } catch (error) {
    health.status = 'unhealthy'
    health.database.error = error instanceof Error ? error.message : String(error)
    console.error('[Health Check] Database connection failed:', error)
  } finally {
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors
    }
  }

  // Check if critical environment variables are missing
  if (!health.environment.hasDatabaseUrl) {
    health.status = 'unhealthy'
  }

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
