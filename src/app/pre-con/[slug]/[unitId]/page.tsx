import React from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UnitDetailPageClient from './UnitDetailPageClient'
import { UnitListing } from '@/lib/types/units'
import { slugify } from '@/lib/utils/propertyUrl'

interface UnitDetailPageProps {
  params: Promise<{
    slug: string;
    unitId: string; // This is now the unit name slug, not the ID
  }>;
}

const UnitDetailPage: React.FC<UnitDetailPageProps> = async ({ params }) => {
  const { slug, unitId: unitNameSlug } = await params;

  try {
    // First, get the project to verify it exists and get its ID and name
    const project = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber: slug },
      select: { id: true, mlsNumber: true, projectName: true },
    });

    if (!project) {
      notFound();
    }

    // Get all units for this project
    const units = await prisma.preConstructionUnit.findMany({
      where: {
        projectId: project.id,
      },
    });

    // Find the unit by matching the slugified unit name
    const unit = units.find(u => {
      const unitNameSlugified = slugify(u.unitName);
      return unitNameSlugified === unitNameSlug;
    });

    // If not found by name, try to find by ID (for backward compatibility with old URLs)
    const unitById = !unit ? units.find(u => u.id === unitNameSlug) : null;
    const foundUnit = unit || unitById;

    if (!foundUnit) {
      notFound();
    }

    // Format unit to match UnitListing interface
    type UnitWithImages = typeof foundUnit & { images?: string[]; floorplanImage?: string | null; studio?: boolean };
    const unitWithImages = foundUnit as UnitWithImages;
    const unitImages = unitWithImages.images || (unitWithImages.floorplanImage ? [unitWithImages.floorplanImage] : []);

    // Normalize status
    let normalizedStatus: 'for-sale' | 'sold-out' = 'for-sale';
    if (foundUnit.status) {
      const statusLower = String(foundUnit.status).toLowerCase().trim();
      if (statusLower === 'sold-out' || statusLower === 'soldout' || statusLower === 'sold') {
        normalizedStatus = 'sold-out';
      } else {
        normalizedStatus = 'for-sale';
      }
    }

    const formattedUnit: UnitListing = {
      id: foundUnit.id,
      name: foundUnit.unitName,
      beds: foundUnit.beds,
      baths: foundUnit.baths,
      sqft: foundUnit.sqft,
      price: foundUnit.price,
      maintenanceFee: foundUnit.maintenanceFee || 0,
      status: normalizedStatus,
      images: unitImages && unitImages.length > 0 ? unitImages : ['/images/floorplan-placeholder.jpg'],
      description: foundUnit.description || undefined,
      features: foundUnit.features || [],
      amenities: foundUnit.amenities || [],
      studio: unitWithImages.studio ?? false,
    };

    return <UnitDetailPageClient unit={formattedUnit} propertyId={slug} projectName={project.projectName} />;
  } catch (error) {
    console.error('Error fetching unit:', error);
    notFound();
  }
}

export default UnitDetailPage

