import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { Prisma } from '@prisma/client'

// POST - Create or update a draft project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      draftId, // If provided, update existing draft
      projectName,
      developer,
      startingPrice,
      endingPrice,
      avgPricePerSqft,
      status,
      parkingPrice,
      parkingPriceDetail,
      lockerPrice,
      lockerPriceDetail,
      assignmentFee,
      developmentLevies,
      developmentCharges,
      streetNumber,
      streetName,
      city,
      state,
      zip,
      country = 'Canada',
      neighborhood,
      majorIntersection,
      latitude,
      longitude,
      propertyType,
      subPropertyType,
      bedroomRange,
      bathroomRange,
      sqftRange,
      hasDen,
      hasStudio,
      hasLoft,
      hasWorkLiveLoft,
      totalUnits,
      availableUnits,
      suites,
      storeys,
      height,
      maintenanceFeesPerSqft,
      maintenanceFeesDetail,
      floorPremiums,
      occupancyDate,
      completionProgress,
      promotions,
      ownershipType,
      garage,
      basement,
      images = [],
      videos = [],
      amenities = [],
      customAmenities = [],
      depositStructure,
      description,
      metaTitle,
      metaDescription,
      keywords = [],
      documents,
      developerInfo,
      architectInfo,
      builderInfo,
      interiorDesignerInfo,
      landscapeArchitectInfo,
      marketingInfo,
      salesMarketingCompany,
      developmentTeamOverview,
      units = [],
    } = body

    // Convert empty strings to null for optional fields
    const normalizeField = (value: string | null | undefined): string | null => {
      if (value === '' || value === undefined) return null
      return value
    }

    // Generate unique mlsNumber from project name (slugified)
    const generateMlsNumber = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Prepare data with proper type conversions
    const imagesArray = Array.isArray(images) 
      ? images.filter((img): img is string => typeof img === 'string' && img.length > 0)
      : []
    
    const videosArray = Array.isArray(videos) 
      ? videos.filter((vid): vid is string => typeof vid === 'string' && vid.length > 0)
      : []
    
    const amenitiesArray = (() => {
      const amenityStrings: string[] = []
      
      if (Array.isArray(amenities)) {
        amenities.forEach((a: { name: string; icon: string } | string) => {
          if (typeof a === 'string' && a.trim().length > 0) {
            amenityStrings.push(a.trim())
          } else if (typeof a === 'object' && a !== null && 'name' in a && typeof a.name === 'string' && a.name.trim().length > 0) {
            amenityStrings.push(a.name.trim())
          }
        })
      }
      
      if (Array.isArray(customAmenities)) {
        customAmenities.forEach((a: string) => {
          if (typeof a === 'string' && a.trim().length > 0) {
            amenityStrings.push(a.trim())
          }
        })
      }
      
      return amenityStrings
    })()

    // Map completionProgress string to integer
    const completionProgressInt = (() => {
      const progressMap: Record<string, number> = {
        'Pre-construction': 0,
        'Construction': 1,
        'Complete': 2,
      }
      
      if (typeof completionProgress === 'number') {
        return completionProgress
      }
      
      if (typeof completionProgress === 'string' && completionProgress.trim()) {
        const progressString = completionProgress.trim()
        if (progressString in progressMap) {
          return progressMap[progressString]
        }
        const parsed = parseInt(progressString, 10)
        if (!isNaN(parsed)) {
          return parsed
        }
      }
      
      return 0 // Default to Pre-construction
    })()

    // Helper function to fetch developer data
    const fetchDeveloperData = async (developerId: string): Promise<string | null> => {
      if (!developerId) return null
      try {
        const developer = await prisma.developmentTeam.findUnique({
          where: { id: developerId },
        })
        if (developer) {
          return JSON.stringify({
            id: developer.id,
            name: developer.name,
            type: developer.type,
            description: developer.description,
            website: developer.website,
            image: developer.image,
            email: developer.email,
            phone: developer.phone,
          })
        }
      } catch (error) {
        console.error('Error fetching developer data:', error)
      }
      return null
    }

    let mlsNumber = projectName ? generateMlsNumber(projectName) : `draft-${Date.now()}`
    
    // If updating existing draft
    if (draftId) {
      const existingDraft = await prisma.preConstructionProject.findUnique({
        where: { id: draftId },
      })

      if (!existingDraft) {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        )
      }

      // Ensure it's a draft (not published)
      if (existingDraft.isPublished) {
        return NextResponse.json(
          { error: 'Cannot update published project as draft' },
          { status: 400 }
        )
      }

      // Update existing draft (preserve createdBy if it exists, otherwise set it)
      const updateData: Prisma.PreConstructionProjectUncheckedUpdateInput = {
        projectName: projectName || existingDraft.projectName,
        createdBy: existingDraft.createdBy || session.user.id, // Set createdBy if not already set
        developer: normalizeField(developer),
        startingPrice: startingPrice && startingPrice !== '' ? (typeof startingPrice === 'number' ? startingPrice : parseFloat(String(startingPrice))) : null,
        endingPrice: endingPrice && endingPrice !== '' ? (typeof endingPrice === 'number' ? endingPrice : parseFloat(String(endingPrice))) : null,
        avgPricePerSqft: avgPricePerSqft && avgPricePerSqft !== '' ? (typeof avgPricePerSqft === 'number' ? avgPricePerSqft : parseFloat(String(avgPricePerSqft))) : null,
        status: normalizeField(status),
        parkingPrice: parkingPrice ? (typeof parkingPrice === 'number' ? parkingPrice : parseFloat(String(parkingPrice))) : null,
        parkingPriceDetail: parkingPriceDetail && parkingPriceDetail.trim() ? parkingPriceDetail.trim() : null,
        lockerPrice: lockerPrice ? (typeof lockerPrice === 'number' ? lockerPrice : parseFloat(String(lockerPrice))) : null,
        lockerPriceDetail: lockerPriceDetail && lockerPriceDetail.trim() ? lockerPriceDetail.trim() : null,
        assignmentFee: assignmentFee ? (typeof assignmentFee === 'number' ? assignmentFee : parseFloat(String(assignmentFee))) : null,
        developmentLevies: developmentLevies && String(developmentLevies).trim() ? String(developmentLevies).trim() : null,
        developmentCharges: developmentCharges ? (typeof developmentCharges === 'number' ? developmentCharges : parseFloat(String(developmentCharges))) : null,
        streetNumber: streetNumber || null,
        streetName: streetName || null,
        city: normalizeField(city),
        state: normalizeField(state),
        zip: zip || null,
        country: country || "Canada",
        neighborhood: neighborhood || null,
        majorIntersection: majorIntersection || null,
        latitude: latitude ? (typeof latitude === 'number' ? latitude : parseFloat(String(latitude))) : null,
        longitude: longitude ? (typeof longitude === 'number' ? longitude : parseFloat(String(longitude))) : null,
        propertyType: normalizeField(propertyType),
        subPropertyType: normalizeField(subPropertyType),
        bedroomRange: normalizeField(bedroomRange),
        bathroomRange: normalizeField(bathroomRange),
        sqftRange: normalizeField(sqftRange),
        hasDen: hasDen === true || hasDen === 'true',
        hasStudio: hasStudio === true || hasStudio === 'true',
        hasLoft: hasLoft === true || hasLoft === 'true',
        hasWorkLiveLoft: hasWorkLiveLoft === true || hasWorkLiveLoft === 'true',
        totalUnits: totalUnits ? (typeof totalUnits === 'number' ? totalUnits : parseInt(String(totalUnits), 10)) : null,
        availableUnits: availableUnits ? (typeof availableUnits === 'number' ? availableUnits : parseInt(String(availableUnits), 10)) : null,
        suites: suites ? (typeof suites === 'number' ? suites : parseInt(String(suites), 10)) : null,
        storeys: storeys ? (typeof storeys === 'number' ? storeys : parseInt(String(storeys), 10)) : null,
        height: height && String(height).trim() ? String(height).trim() : null,
        maintenanceFeesPerSqft: maintenanceFeesPerSqft ? (typeof maintenanceFeesPerSqft === 'number' ? maintenanceFeesPerSqft : parseFloat(String(maintenanceFeesPerSqft))) : null,
        maintenanceFeesDetail: maintenanceFeesDetail && maintenanceFeesDetail.trim() ? maintenanceFeesDetail.trim() : null,
        floorPremiums: floorPremiums && floorPremiums.trim() ? floorPremiums.trim() : null,
        occupancyDate: occupancyDate || null,
        completionProgress: completionProgressInt !== undefined ? completionProgressInt : null,
        promotions: promotions && promotions.trim() ? promotions.trim() : null,
        ownershipType: ownershipType && ownershipType.trim() ? ownershipType.trim() : null,
        garage: garage && garage.trim() ? garage.trim() : null,
        basement: basement && basement.trim() ? basement.trim() : null,
        images: imagesArray.length > 0 ? imagesArray : [],
        videos: videosArray.length > 0 ? videosArray : [],
        amenities: amenitiesArray.length > 0 ? amenitiesArray : [],
        features: [],
        depositStructure: depositStructure && depositStructure.trim() ? depositStructure.trim() : null,
        description: description && description.trim() ? description.trim() : null,
        metaTitle: metaTitle && metaTitle.trim() ? metaTitle.trim() : null,
        metaDescription: metaDescription && metaDescription.trim() ? metaDescription.trim() : null,
        keywords: Array.isArray(keywords) ? keywords.filter(k => k && String(k).trim()).map(k => String(k).trim()) : [],
        documents: documents ? (() => {
          try {
            if (typeof documents === 'string') {
              const parsed = JSON.parse(documents)
              return JSON.stringify(parsed)
            }
            return JSON.stringify(documents)
          } catch (e) {
            console.error('Error stringifying documents:', e)
            return null
          }
        })() : null,
        developerInfo: developerInfo ? await fetchDeveloperData(developerInfo) : null,
        architectInfo: architectInfo ? await fetchDeveloperData(architectInfo) : null,
        builderInfo: builderInfo ? await fetchDeveloperData(builderInfo) : null,
        interiorDesignerInfo: interiorDesignerInfo ? await fetchDeveloperData(interiorDesignerInfo) : null,
        landscapeArchitectInfo: landscapeArchitectInfo ? await fetchDeveloperData(landscapeArchitectInfo) : null,
        marketingInfo: marketingInfo ? await fetchDeveloperData(marketingInfo) : null,
        salesMarketingCompany: salesMarketingCompany && salesMarketingCompany.trim() ? salesMarketingCompany.trim() : null,
        developmentTeamOverview: developmentTeamOverview && developmentTeamOverview.trim() ? developmentTeamOverview.trim() : null,
        isPublished: false, // Always keep as draft
      }

      const updatedDraft = await prisma.preConstructionProject.update({
        where: { id: draftId },
        data: updateData,
      })

      // Handle units update (delete all existing and create new ones)
      if (units !== undefined && Array.isArray(units)) {
        // Delete all existing units
        await prisma.preConstructionUnit.deleteMany({
          where: { projectId: draftId },
        })

        // Create new units if any
        if (units.length > 0) {
          await prisma.preConstructionUnit.createMany({
            data: units.map((unit: {
              id?: string
              unitName: string
              beds: number | string
              baths: number | string
              sqft: number | string
              price: number | string
              maintenanceFee?: number | string | null
              status: string
              studio?: boolean
              images?: string[]
              description?: string | null
              features?: string[]
              amenities?: string[]
            }) => ({
              projectId: draftId,
              unitName: unit.unitName,
              beds: String(unit.beds || ''),
              baths: String(unit.baths || ''),
              sqft: typeof unit.sqft === 'number' ? unit.sqft : parseInt(String(unit.sqft), 10),
              price: typeof unit.price === 'number' ? unit.price : parseFloat(String(unit.price)),
              maintenanceFee: unit.maintenanceFee ? (typeof unit.maintenanceFee === 'number' ? unit.maintenanceFee : parseFloat(String(unit.maintenanceFee))) : null,
              status: unit.status || 'for-sale',
              studio: unit.studio === true,
              images: Array.isArray(unit.images) ? unit.images.filter((img): img is string => typeof img === 'string' && img.length > 0) : [],
              description: unit.description || null,
              features: Array.isArray(unit.features) ? unit.features : [],
              amenities: Array.isArray(unit.amenities) ? unit.amenities : [],
            })),
          })
        }
      }

      return NextResponse.json({
        draft: updatedDraft,
        id: updatedDraft.id,
        mlsNumber: updatedDraft.mlsNumber,
      })
    }

    // Create new draft
    // Only projectName is required, but we can create with minimal data
    if (!projectName || projectName.trim() === '') {
      // Create with a temporary name
      mlsNumber = `draft-${Date.now()}`
    } else {
      // Check if mlsNumber already exists
      let counter = 1
      let existing = await prisma.preConstructionProject.findUnique({
        where: { mlsNumber },
      })

      while (existing) {
        mlsNumber = `${generateMlsNumber(projectName)}-${counter}`
        existing = await prisma.preConstructionProject.findUnique({
          where: { mlsNumber },
        })
        counter++
      }
    }

    const newDraft = await prisma.preConstructionProject.create({
      data: {
        mlsNumber,
        projectName: projectName || 'Untitled Project',
        createdBy: session.user.id, // Track who created the draft
        developer: normalizeField(developer),
        startingPrice: startingPrice && startingPrice !== '' ? (typeof startingPrice === 'number' ? startingPrice : parseFloat(String(startingPrice))) : null,
        endingPrice: endingPrice && endingPrice !== '' ? (typeof endingPrice === 'number' ? endingPrice : parseFloat(String(endingPrice))) : null,
        avgPricePerSqft: avgPricePerSqft && avgPricePerSqft !== '' ? (typeof avgPricePerSqft === 'number' ? avgPricePerSqft : parseFloat(String(avgPricePerSqft))) : null,
        status: normalizeField(status),
        parkingPrice: parkingPrice ? (typeof parkingPrice === 'number' ? parkingPrice : parseFloat(String(parkingPrice))) : null,
        parkingPriceDetail: parkingPriceDetail && parkingPriceDetail.trim() ? parkingPriceDetail.trim() : null,
        lockerPrice: lockerPrice ? (typeof lockerPrice === 'number' ? lockerPrice : parseFloat(String(lockerPrice))) : null,
        lockerPriceDetail: lockerPriceDetail && lockerPriceDetail.trim() ? lockerPriceDetail.trim() : null,
        assignmentFee: assignmentFee ? (typeof assignmentFee === 'number' ? assignmentFee : parseFloat(String(assignmentFee))) : null,
        developmentLevies: developmentLevies && String(developmentLevies).trim() ? String(developmentLevies).trim() : null,
        developmentCharges: developmentCharges ? (typeof developmentCharges === 'number' ? developmentCharges : parseFloat(String(developmentCharges))) : null,
        streetNumber: streetNumber || null,
        streetName: streetName || null,
        city: normalizeField(city),
        state: normalizeField(state),
        zip: zip || null,
        country: country || "Canada",
        neighborhood: neighborhood || null,
        majorIntersection: majorIntersection || null,
        latitude: latitude ? (typeof latitude === 'number' ? latitude : parseFloat(String(latitude))) : null,
        longitude: longitude ? (typeof longitude === 'number' ? longitude : parseFloat(String(longitude))) : null,
        propertyType: normalizeField(propertyType),
        subPropertyType: normalizeField(subPropertyType),
        bedroomRange: normalizeField(bedroomRange),
        bathroomRange: normalizeField(bathroomRange),
        sqftRange: normalizeField(sqftRange),
        hasDen: hasDen === true || hasDen === 'true',
        hasStudio: hasStudio === true || hasStudio === 'true',
        hasLoft: hasLoft === true || hasLoft === 'true',
        hasWorkLiveLoft: hasWorkLiveLoft === true || hasWorkLiveLoft === 'true',
        totalUnits: totalUnits ? (typeof totalUnits === 'number' ? totalUnits : parseInt(String(totalUnits), 10)) : null,
        availableUnits: availableUnits ? (typeof availableUnits === 'number' ? availableUnits : parseInt(String(availableUnits), 10)) : null,
        suites: suites ? (typeof suites === 'number' ? suites : parseInt(String(suites), 10)) : null,
        storeys: storeys ? (typeof storeys === 'number' ? storeys : parseInt(String(storeys), 10)) : null,
        height: height && String(height).trim() ? String(height).trim() : null,
        maintenanceFeesPerSqft: maintenanceFeesPerSqft ? (typeof maintenanceFeesPerSqft === 'number' ? maintenanceFeesPerSqft : parseFloat(String(maintenanceFeesPerSqft))) : null,
        maintenanceFeesDetail: maintenanceFeesDetail && maintenanceFeesDetail.trim() ? maintenanceFeesDetail.trim() : null,
        floorPremiums: floorPremiums && floorPremiums.trim() ? floorPremiums.trim() : null,
        occupancyDate: occupancyDate || null,
        completionProgress: completionProgressInt !== undefined ? completionProgressInt : null,
        promotions: promotions && promotions.trim() ? promotions.trim() : null,
        ownershipType: ownershipType && ownershipType.trim() ? ownershipType.trim() : null,
        garage: garage && garage.trim() ? garage.trim() : null,
        basement: basement && basement.trim() ? basement.trim() : null,
        images: imagesArray.length > 0 ? imagesArray : [],
        videos: videosArray.length > 0 ? videosArray : [],
        amenities: amenitiesArray.length > 0 ? amenitiesArray : [],
        features: [],
        depositStructure: depositStructure && depositStructure.trim() ? depositStructure.trim() : null,
        description: description && description.trim() ? description.trim() : null,
        metaTitle: metaTitle && metaTitle.trim() ? metaTitle.trim() : null,
        metaDescription: metaDescription && metaDescription.trim() ? metaDescription.trim() : null,
        keywords: Array.isArray(keywords) ? keywords.filter(k => k && String(k).trim()).map(k => String(k).trim()) : [],
        documents: documents ? (() => {
          try {
            if (typeof documents === 'string') {
              const parsed = JSON.parse(documents)
              return JSON.stringify(parsed)
            }
            return JSON.stringify(documents)
          } catch (e) {
            console.error('Error stringifying documents:', e)
            return null
          }
        })() : null,
        developerInfo: developerInfo ? await fetchDeveloperData(developerInfo) : null,
        architectInfo: architectInfo ? await fetchDeveloperData(architectInfo) : null,
        builderInfo: builderInfo ? await fetchDeveloperData(builderInfo) : null,
        interiorDesignerInfo: interiorDesignerInfo ? await fetchDeveloperData(interiorDesignerInfo) : null,
        landscapeArchitectInfo: landscapeArchitectInfo ? await fetchDeveloperData(landscapeArchitectInfo) : null,
        marketingInfo: marketingInfo ? await fetchDeveloperData(marketingInfo) : null,
        salesMarketingCompany: salesMarketingCompany && salesMarketingCompany.trim() ? salesMarketingCompany.trim() : null,
        developmentTeamOverview: developmentTeamOverview && developmentTeamOverview.trim() ? developmentTeamOverview.trim() : null,
        isPublished: false, // Always create as draft
      } as unknown as Prisma.PreConstructionProjectCreateInput,
    })

    // Handle units creation for new draft
    if (units !== undefined && Array.isArray(units) && units.length > 0) {
      await prisma.preConstructionUnit.createMany({
        data: units.map((unit: {
          id?: string
          unitName: string
          beds: number | string
          baths: number | string
          sqft: number | string
          price: number | string
          maintenanceFee?: number | string | null
          status: string
          studio?: boolean
          images?: string[]
          description?: string | null
          features?: string[]
          amenities?: string[]
        }) => ({
          projectId: newDraft.id,
          unitName: unit.unitName,
          beds: String(unit.beds || ''),
          baths: String(unit.baths || ''),
          sqft: typeof unit.sqft === 'number' ? unit.sqft : parseInt(String(unit.sqft), 10),
          price: typeof unit.price === 'number' ? unit.price : parseFloat(String(unit.price)),
          maintenanceFee: unit.maintenanceFee ? (typeof unit.maintenanceFee === 'number' ? unit.maintenanceFee : parseFloat(String(unit.maintenanceFee))) : null,
          status: unit.status || 'for-sale',
          studio: unit.studio === true,
          images: Array.isArray(unit.images) ? unit.images.filter((img): img is string => typeof img === 'string' && img.length > 0) : [],
          description: unit.description || null,
          features: Array.isArray(unit.features) ? unit.features : [],
          amenities: Array.isArray(unit.amenities) ? unit.amenities : [],
        })),
      })
    }

    return NextResponse.json({
      draft: newDraft,
      id: newDraft.id,
      mlsNumber: newDraft.mlsNumber,
    })
  } catch (error) {
    console.error('Error saving draft:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save draft'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

