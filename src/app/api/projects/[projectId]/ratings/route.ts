import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/api/auth-utils';

// GET - Get rating statistics for a property (works for all property types)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get('propertyType') || 'pre-construction'; // Default to pre-construction for backward compatibility

    // Get all ratings for this property
    const ratings = await prisma.propertyRating.findMany({
      where: { 
        propertyId: projectId,
        propertyType: propertyType
      },
      select: { rating: true }
    });

    if (ratings.length === 0) {
      const response = NextResponse.json({
        average: 0,
        total: 0,
        ratings: []
      });
      // Cache empty responses for shorter time (1 minute)
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return response;
    }

    // Calculate average
    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / total) * 10) / 10;

    // Get user's rating if logged in (session or Bearer)
    const auth = await getAuthenticatedUser(request);
    let userRating = null;
    
    if (auth?.user?.id) {
      const userRatingRecord = await prisma.propertyRating.findFirst({
        where: {
          propertyId: projectId,
          propertyType: propertyType,
          userId: auth.user.id
        },
        select: { rating: true }
      });
      userRating = userRatingRecord?.rating || null;
    } else {
      // Check for anonymous rating using session ID
      const sessionId = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value;
      if (sessionId) {
        const anonymousRating = await prisma.propertyRating.findFirst({
          where: {
            propertyId: projectId,
            propertyType: propertyType,
            sessionId,
            userId: null
          },
          select: { rating: true }
        });
        userRating = anonymousRating?.rating || null;
      }
    }

    const response = NextResponse.json({
      average,
      total,
      userRating,
      ratings: ratings.map(r => r.rating)
    });

    // Add caching headers to reduce duplicate requests
    // Cache for 5 minutes, but allow stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

// POST - Create or update a rating (works for all property types)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { rating, propertyType = 'pre-construction' } = body; // Default to pre-construction for backward compatibility

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate propertyType
    const validPropertyTypes = ['regular', 'pre-construction'];
    if (!validPropertyTypes.includes(propertyType)) {
      return NextResponse.json(
        { error: 'Invalid propertyType. Must be "regular" or "pre-construction"' },
        { status: 400 }
      );
    }

    // Get auth (optional - allows anonymous ratings)
    const auth = await getAuthenticatedUser(request);
    const userId = auth?.user?.id || null;
    
    // For anonymous users, use session ID or generate one
    // Get session ID from cookies
    const sessionId = request.cookies.get('next-auth.session-token')?.value || 
                     request.cookies.get('__Secure-next-auth.session-token')?.value ||
                     null;

    // Check if user already rated this property
    let existingRating = null;
    if (userId) {
      existingRating = await prisma.propertyRating.findFirst({
        where: {
          propertyId: projectId,
          propertyType: propertyType,
          userId
        }
      });
    } else if (sessionId) {
      existingRating = await prisma.propertyRating.findFirst({
        where: {
          propertyId: projectId,
          propertyType: propertyType,
          sessionId,
          userId: null
        }
      });
    }

    // Create or update rating
    let ratingRecord;
    if (existingRating) {
      ratingRecord = await prisma.propertyRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          updatedAt: new Date()
        }
      });
    } else {
      ratingRecord = await prisma.propertyRating.create({
        data: {
          propertyId: projectId,
          propertyType: propertyType,
          userId,
          sessionId: userId ? null : sessionId,
          rating
        }
      });
    }

    // Get updated statistics
    const ratings = await prisma.propertyRating.findMany({
      where: { 
        propertyId: projectId,
        propertyType: propertyType
      },
      select: { rating: true }
    });

    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / total) * 10) / 10;

    return NextResponse.json({
      success: true,
      rating: ratingRecord.rating,
      average,
      total
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}

