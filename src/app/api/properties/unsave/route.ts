import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
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
          userId: session.user.id,
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

