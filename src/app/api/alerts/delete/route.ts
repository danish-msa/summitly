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
    const id = searchParams.get('id')
    const mlsNumber = searchParams.get('mlsNumber')

    if (!id && !mlsNumber) {
      return NextResponse.json(
        { error: 'Alert ID or MLS number is required' },
        { status: 400 }
      )
    }

    const where: any = {
      userId: session.user.id,
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
  } catch (error: any) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete alert' },
      { status: 500 }
    )
  }
}

