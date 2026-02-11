import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

/**
 * Health Check Endpoint
 * 
 * Use this to verify your API is running and database is connected
 * GET /api/v1/health
 */

async function handler() {
  let dbStatus = 'unknown'
  
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'disconnected'
    console.error('[Health Check] Database connection failed:', error)
  }

  return successResponse({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async () => handler())
}

