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
    const basePropertyMlsNumber = searchParams.get('basePropertyMlsNumber')

    if (!mlsNumber) {
      return NextResponse.json(
        { error: 'MLS number is required' },
        { status: 400 }
      )
    }

    if (!basePropertyMlsNumber) {
      return NextResponse.json(
        { error: 'Base property MLS number is required' },
        { status: 400 }
      )
    }

    // Delete the saved comparable
    await prisma.savedComparable.delete({
      where: {
        userId_basePropertyMlsNumber_mlsNumber: {
          userId: session.user.id,
          basePropertyMlsNumber: basePropertyMlsNumber.toString(),
          mlsNumber: mlsNumber.toString(),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsaving comparable:', error)
    
    // Check if it's a Prisma error (table might not exist)
    if (error instanceof Error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        return NextResponse.json(
          { error: 'Database table not found. Please run migrations: npx prisma migrate dev' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to unsave comparable' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to unsave comparable' },
      { status: 500 }
    )
  }
}

