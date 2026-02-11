import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsNumber: string; unitId: string }> }
) {
  try {
    const { mlsNumber, unitId } = await params;

    // First, get the project to verify it exists
    const project = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber },
      select: { id: true, mlsNumber: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get the unit
    const unit = await prisma.preConstructionUnit.findFirst({
      where: {
        id: unitId,
        projectId: project.id,
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    // Format unit to match UnitListing interface
    type UnitWithImages = typeof unit & { images?: string[]; floorplanImage?: string | null; studio?: boolean };
    const unitWithImages = unit as UnitWithImages;
    const unitImages = unitWithImages.images || (unitWithImages.floorplanImage ? [unitWithImages.floorplanImage] : []);

    // Normalize status
    let normalizedStatus: 'for-sale' | 'sold-out' = 'for-sale';
    if (unit.status) {
      const statusLower = String(unit.status).toLowerCase().trim();
      if (statusLower === 'sold-out' || statusLower === 'soldout' || statusLower === 'sold') {
        normalizedStatus = 'sold-out';
      } else {
        normalizedStatus = 'for-sale';
      }
    }

    const formattedUnit = {
      id: unit.id,
      name: unit.unitName,
      beds: unit.beds,
      baths: unit.baths,
      sqft: unit.sqft,
      price: unit.price,
      maintenanceFee: unit.maintenanceFee || 0,
      status: normalizedStatus,
      images: unitImages && unitImages.length > 0 ? unitImages : ['/images/floorplan-placeholder.jpg'],
      description: unit.description || undefined,
      features: unit.features || [],
      amenities: unit.amenities || [],
      studio: unitWithImages.studio ?? false,
    };

    return NextResponse.json({ unit: formattedUnit });
  } catch (error) {
    console.error('Error fetching unit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unit';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

