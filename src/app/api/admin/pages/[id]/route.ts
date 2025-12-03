import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// GET - Get a single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
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

    const page = await prisma.page.findUnique({
      where: { id },
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
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

// PUT - Update a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
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

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Validate parent if provided
    if (parentId) {
      // Prevent setting self as parent
      if (parentId === id) {
        return NextResponse.json(
          { error: 'Cannot set page as its own parent' },
          { status: 400 }
        )
      }

      const parent = await prisma.page.findUnique({
        where: { id: parentId },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent page not found' },
          { status: 400 }
        )
      }

      // Check for circular references by checking if the parent is a descendant
      const checkCircular = async (pageId: string, targetId: string): Promise<boolean> => {
        const page = await prisma.page.findUnique({
          where: { id: pageId },
          select: { parentId: true },
        })
        
        if (!page?.parentId) return false
        if (page.parentId === targetId) return true
        
        return checkCircular(page.parentId, targetId)
      }

      const isCircular = await checkCircular(parentId, id)
      if (isCircular) {
        return NextResponse.json(
          { error: 'Cannot set parent: circular reference detected' },
          { status: 400 }
        )
      }
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

    // Update page
    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(status && { status }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
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
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
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

    // Check if page exists
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Check if page has children
    if (page._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete page with child pages. Please delete or reassign child pages first.' },
        { status: 400 }
      )
    }

    // Delete page
    await prisma.page.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Page deleted successfully' })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}

