import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { Prisma } from '@prisma/client'

// GET - List all pages (with pagination and filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const parentId = searchParams.get('parentId') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.PageWhereInput = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      where.status = status as 'DRAFT' | 'PUBLISHED'
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (parentId === 'none') {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    }

    // Build orderBy clause
    const sortFieldMap: Record<string, keyof Prisma.PageOrderByWithRelationInput> = {
      title: 'title',
      slug: 'slug',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
    
    const sortField = sortFieldMap[sortBy] || 'createdAt'
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    
    const orderBy: Prisma.PageOrderByWithRelationInput = {
      [sortField]: order,
    }

    // Get pages and total count
    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
      }),
      prisma.page.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

// POST - Create a new page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      status,
      parentId,
      categoryId,
    } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      )
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.page.findUnique({
        where: { id: parentId },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent page not found' },
          { status: 400 }
        )
      }

      // Note: Circular reference check will be done in PUT endpoint when updating
      // For new pages, we can't have circular references yet
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.pageCategory.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    // Create page
    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content: content || null,
        excerpt: excerpt || null,
        status: status || 'DRAFT',
        parentId: parentId || null,
        categoryId: categoryId || null,
        createdBy: session.user.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}

