import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        projects: [],
        pages: [],
      });
    }

    const searchTerm = query.trim();

    // Search projects
    const projects = await prisma.preConstructionProject.findMany({
      where: {
        OR: [
          { projectName: { contains: searchTerm, mode: 'insensitive' } },
          { developer: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { neighborhood: { contains: searchTerm, mode: 'insensitive' } },
          { propertyType: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        mlsNumber: true,
        projectName: true,
        developer: true,
        city: true,
        neighborhood: true,
        propertyType: true,
        status: true,
        startingPrice: true,
        images: true,
        streetNumber: true,
        streetName: true,
      },
      orderBy: [
        { projectName: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Search location pages
    const pages = await prisma.preConstructionPageContent.findMany({
      where: {
        pageType: 'by-location',
        isPublished: true,
        OR: [
          { pageValue: { contains: searchTerm, mode: 'insensitive' } },
          { title: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        pageValue: true,
        locationType: true,
        title: true,
        description: true,
        heroImage: true,
      },
      orderBy: [
        { pageValue: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      projects: projects.map(project => ({
        id: project.id,
        mlsNumber: project.mlsNumber,
        name: project.projectName,
        developer: project.developer,
        city: project.city,
        neighborhood: project.neighborhood,
        propertyType: project.propertyType,
        status: project.status,
        price: project.startingPrice,
        image: project.images?.[0] || null,
        address: [project.streetNumber, project.streetName].filter(Boolean).join(' ') || null,
        type: 'project',
      })),
      pages: pages.map(page => ({
        id: page.id,
        name: page.title || page.pageValue,
        location: page.pageValue,
        locationType: page.locationType,
        description: page.description,
        image: page.heroImage,
        type: 'page',
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

