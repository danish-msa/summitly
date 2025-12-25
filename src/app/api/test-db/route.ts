import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple endpoint to test database connection
export async function GET() {
  try {
    // Log database URL (masked)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const maskedDbUrl = dbUrl !== 'NOT SET' 
      ? dbUrl.replace(/:([^:@]+)@/, ':****@').replace(/\/\/([^:]+):/, '//****:')
      : 'NOT SET'
    
    console.log('[TEST-DB] Testing database connection...')
    console.log('[TEST-DB] DATABASE_URL:', maskedDbUrl)
    console.log('[TEST-DB] NODE_ENV:', process.env.NODE_ENV)
    
    // Test connection
    await prisma.$connect()
    console.log('[TEST-DB] ✅ Connection successful')
    
    // Test a simple query
    const projectCount = await prisma.preConstructionProject.count({
      where: { isPublished: true }
    })
    
    const totalProjects = await prisma.preConstructionProject.count()
    
    // Test a simple query with propertyType filter
    const condosCount = await prisma.preConstructionProject.count({
      where: {
        isPublished: true,
        OR: [
          { propertyType: 'Condos' },
          { propertyType: 'condos' },
          { propertyType: 'CONDOS' },
          { propertyType: 'Condominium' },
        ]
      }
    })
    
    // Get actual propertyType values from database
    const propertyTypes = await prisma.preConstructionProject.findMany({
      where: { isPublished: true },
      select: { propertyType: true },
      distinct: ['propertyType'],
    })
    
    const propertyTypeValues = propertyTypes
      .map(p => p.propertyType)
      .filter(Boolean)
      .sort()
    
    // Get sample projects to see their propertyType
    const sampleProjects = await prisma.preConstructionProject.findMany({
      where: { isPublished: true },
      select: {
        mlsNumber: true,
        projectName: true,
        propertyType: true,
        subPropertyType: true,
      },
      take: 5,
    })
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        databaseUrl: maskedDbUrl,
        environment: process.env.NODE_ENV,
        counts: {
          totalProjects,
          publishedProjects: projectCount,
          publishedCondos: condosCount,
        },
        propertyTypes: propertyTypeValues,
        sampleProjects,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[TEST-DB] ❌ Database connection failed:', {
      message: errorMessage,
      stack: errorStack,
    })
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

