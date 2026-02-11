import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mlsNumber = searchParams.get('mlsNumber')

    if (!mlsNumber) {
      return NextResponse.json(
        { error: 'MLS number is required' },
        { status: 400 }
      )
    }

    // Delete the saved property
    await prisma.savedProperty.delete({
      where: {
        userId_mlsNumber: {
          userId: auth.user.id,
          mlsNumber: mlsNumber.toString(),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsaving property:', error)
    return NextResponse.json(
      { error: 'Failed to unsave property' },
      { status: 500 }
    )
  }
}

