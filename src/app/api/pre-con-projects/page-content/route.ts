import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Public endpoint to fetch page content for website display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageType = searchParams.get("pageType")
    const pageValue = searchParams.get("pageValue")

    if (!pageType || !pageValue) {
      return NextResponse.json(
        { error: "pageType and pageValue are required" },
        { status: 400 }
      )
    }

    const pageContent = await prisma.preConstructionPageContent.findUnique({
      where: {
        pageType_pageValue: {
          pageType,
          pageValue,
        },
      },
    })

    // Return null if not found or not published
    if (!pageContent || !pageContent.isPublished) {
      return NextResponse.json({ pageContent: null })
    }

    return NextResponse.json({ pageContent })
  } catch (error) {
    console.error("Error fetching page content:", error)
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    )
  }
}

