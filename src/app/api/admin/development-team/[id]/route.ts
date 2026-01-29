import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { isAdmin } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { DeveloperType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const developer = await prisma.developmentTeam.findUnique({
      where: { id },
    })

    if (!developer) {
      return NextResponse.json(
        { error: 'Development team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(developer)
  } catch (error) {
    console.error('Error fetching development team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch development team member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(auth.user.role)) {
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

    // Check if development team member exists
    const existing = await prisma.developmentTeam.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Development team member not found' },
        { status: 404 }
      )
    }

    // Update development team member
    const developer = await prisma.developmentTeam.update({
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
    console.error('Error updating development team member:', error)
    return NextResponse.json(
      { error: 'Failed to update development team member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if development team member exists
    const existing = await prisma.developmentTeam.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Development team member not found' },
        { status: 404 }
      )
    }

    // Delete development team member
    await prisma.developmentTeam.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting development team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete development team member' },
      { status: 500 }
    )
  }
}

