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
    const id = searchParams.get('id')
    const mlsNumber = searchParams.get('mlsNumber')

    if (!id && !mlsNumber) {
      return NextResponse.json(
        { error: 'Alert ID or MLS number is required' },
        { status: 400 }
      )
    }

    const where: {
      userId: string
      id?: string
      mlsNumber?: string
    } = {
      userId: auth.user.id,
    }

    if (id) {
      where.id = id
    } else if (mlsNumber) {
      where.mlsNumber = mlsNumber
    }

    await prisma.propertyWatchlist.deleteMany({
      where,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting alert:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete alert'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

