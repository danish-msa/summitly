import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Test endpoint to debug the actual query used by the API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyType = searchParams.get('propertyType') || 'Condos'
    
    console.log('[TEST-QUERY] Testing with propertyType:', propertyType)
    
    // Build the same query as the actual API
    const whereConditions: Prisma.PreConstructionProjectWhereInput[] = [
      { isPublished: true },
    ]
    
    if (propertyType) {
      const propertyTypeLower = propertyType.toLowerCase()
      const propertyTypeCapitalized = propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()
      const propertyTypeUpper = propertyType.toUpperCase()
      
      const variations: string[] = [
        propertyType,
        propertyTypeCapitalized,
        propertyTypeUpper,
        propertyTypeLower,
      ]
      
      if (propertyTypeLower === 'condos' || propertyTypeLower === 'condo') {
        variations.push('Condominium', 'condominium', 'CONDOMINIUM', 'Condo', 'condo')
      }
      
      const propertyTypeCondition: Prisma.PreConstructionProjectWhereInput = {
        OR: variations.map(variation => ({ propertyType: variation }))
      }
      whereConditions.push(propertyTypeCondition)
      
      console.log('[TEST-QUERY] PropertyType variations:', variations)
    }
    
    const where: Prisma.PreConstructionProjectWhereInput = whereConditions.length > 1
      ? { AND: whereConditions }
      : whereConditions[0] || { isPublished: true }
    
    console.log('[TEST-QUERY] Where clause:', JSON.stringify(where, null, 2))
    
    // Execute the query
    const projects = await prisma.preConstructionProject.findMany({
      where,
      take: 10,
      select: {
        mlsNumber: true,
        projectName: true,
        propertyType: true,
        subPropertyType: true,
        isPublished: true,
        status: true,
      },
    })
    
    const count = await prisma.preConstructionProject.count({ where })
    
    // Also check what propertyTypes actually exist
    const allPropertyTypes = await prisma.preConstructionProject.findMany({
      where: { isPublished: true },
      select: { propertyType: true },
      distinct: ['propertyType'],
    })
    
    return NextResponse.json({
      success: true,
      query: {
        propertyType,
        variations: propertyType ? [
          propertyType,
          propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase(),
          propertyType.toUpperCase(),
          propertyType.toLowerCase(),
          ...(propertyType.toLowerCase() === 'condos' || propertyType.toLowerCase() === 'condo' 
            ? ['Condominium', 'condominium', 'CONDOMINIUM', 'Condo', 'condo'] 
            : [])
        ] : [],
        whereClause: where,
      },
      results: {
        count,
        projects: projects.slice(0, 5), // Show first 5
        allPropertyTypesInDb: allPropertyTypes
          .map(p => p.propertyType)
          .filter(Boolean)
          .sort(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[TEST-QUERY] Error:', {
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

