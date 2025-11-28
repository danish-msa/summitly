import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"

// GET - Fetch page contents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pageType = searchParams.get("pageType")
    const pageValue = searchParams.get("pageValue")

    const where: {
      pageType?: string
      pageValue?: string
    } = {}

    if (pageType) {
      where.pageType = pageType
    }

    if (pageValue) {
      where.pageValue = pageValue
    }

    const pageContents = await prisma.preConstructionPageContent.findMany({
      where,
      orderBy: [
        { pageType: "asc" },
        { pageValue: "asc" },
      ],
    })

    // If fetching a single page content
    if (pageType && pageValue) {
      const pageContent = pageContents[0] || null
      return NextResponse.json({ pageContent })
    }

    return NextResponse.json({ pageContents })
  } catch (error) {
    console.error("Error fetching page contents:", error)
    return NextResponse.json(
      { error: "Failed to fetch page contents" },
      { status: 500 }
    )
  }
}

// PUT - Create or update page content
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      pageType,
      pageValue,
      title,
      description,
      heroImage,
      metaTitle,
      metaDescription,
      customContent,
      faqs,
      isPublished,
    } = body

    if (!pageType || !pageValue) {
      return NextResponse.json(
        { error: "pageType and pageValue are required" },
        { status: 400 }
      )
    }

    // Validate pageType
    const validPageTypes = ["propertyType", "status", "completionYear", "city"]
    if (!validPageTypes.includes(pageType)) {
      return NextResponse.json(
        { error: `Invalid pageType. Must be one of: ${validPageTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate completionYear format if applicable
    if (pageType === "completionYear" && !/^\d{4}$/.test(pageValue)) {
      return NextResponse.json(
        { error: "completionYear must be a 4-digit year" },
        { status: 400 }
      )
    }

    // Parse FAQs if provided (should be JSON string or array)
    let faqsJson = null;
    if (faqs !== undefined && faqs !== null) {
      if (typeof faqs === 'string') {
        try {
          faqsJson = faqs.trim() === '' ? null : faqs;
        } catch {
          faqsJson = null;
        }
      } else if (Array.isArray(faqs)) {
        faqsJson = JSON.stringify(faqs);
      } else {
        faqsJson = null;
      }
    }

    const pageContent = await prisma.preConstructionPageContent.upsert({
      where: {
        pageType_pageValue: {
          pageType,
          pageValue,
        },
      },
      update: {
        title: title || null,
        description: description || null,
        heroImage: heroImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        customContent: customContent || null,
        faqs: faqsJson,
        isPublished: isPublished ?? false,
      },
      create: {
        pageType,
        pageValue,
        title: title || null,
        description: description || null,
        heroImage: heroImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        customContent: customContent || null,
        faqs: faqsJson,
        isPublished: isPublished ?? false,
      },
    })

    return NextResponse.json({ pageContent })
  } catch (error) {
    console.error("Error saving page content:", error)
    return NextResponse.json(
      { error: "Failed to save page content" },
      { status: 500 }
    )
  }
}

// DELETE - Delete page content
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pageType = searchParams.get("pageType")
    const pageValue = searchParams.get("pageValue")

    if (!pageType || !pageValue) {
      return NextResponse.json(
        { error: "pageType and pageValue are required" },
        { status: 400 }
      )
    }

    await prisma.preConstructionPageContent.delete({
      where: {
        pageType_pageValue: {
          pageType,
          pageValue,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting page content:", error)
    return NextResponse.json(
      { error: "Failed to delete page content" },
      { status: 500 }
    )
  }
}

