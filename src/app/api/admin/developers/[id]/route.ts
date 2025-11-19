import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { DeveloperType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const developer = await prisma.developer.findUnique({
      where: { id },
    })

    if (!developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(developer)
  } catch (error) {
    console.error('Error fetching developer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch developer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, type, description, website, image, email, phone } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (!Object.values(DeveloperType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid developer type' },
        { status: 400 }
      )
    }

    // Check if developer exists
    const existing = await prisma.developer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Update developer
    const developer = await prisma.developer.update({
      where: { id },
      data: {
        name,
        type: type as DeveloperType,
        description: description || null,
        website: website || null,
        image: image || null,
        email: email || null,
        phone: phone || null,
      },
    })

    return NextResponse.json(developer)
  } catch (error) {
    console.error('Error updating developer:', error)
    return NextResponse.json(
      { error: 'Failed to update developer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if developer exists
    const existing = await prisma.developer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Delete developer
    await prisma.developer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting developer:', error)
    return NextResponse.json(
      { error: 'Failed to delete developer' },
      { status: 500 }
    )
  }
}

