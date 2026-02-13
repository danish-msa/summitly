import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth-utils";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { Prisma } from "@prisma/client";
import { isOurStorageUrl, uploadImageFromUrl } from "@/lib/s3";

const AGENT_TABLE_MISSING_MESSAGE =
  "Agent tables are not created yet. Run: npm run prisma:agents:schema (or execute prisma/migrations/add_agent_schema.sql on your database).";

function isAgentTableMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2021"
  );
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "agent";
}

// GET - List all agents (admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";
    const typeFilter = searchParams.get("agentType") || "";
    const sortBy = searchParams.get("sortBy") || "sort_order";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { job_title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter as "ACTIVE" | "INACTIVE";
    }
    if (typeFilter && typeFilter !== "all") {
      where.agent_type = typeFilter as "COMMERCIAL" | "RESIDENTIAL" | "BOTH";
    }

    const sortField =
      sortBy === "createdAt"
        ? "createdAt"
        : sortBy === "full_name"
          ? "full_name"
          : "sort_order";
    const orderBy: Prisma.AgentOrderByWithRelationInput = {
      [sortField]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          social_links: true,
        },
      }),
      prisma.agent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      agents,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    if (isAgentTableMissing(error)) {
      return NextResponse.json(
        { error: AGENT_TABLE_MISSING_MESSAGE },
        { status: 503 }
      );
    }
    console.error("Admin agents GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST - Create new agent (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const firstName = String(body.first_name ?? "").trim();
    const lastName = String(body.last_name ?? "").trim();
    const fullName = String(body.full_name ?? "").trim() || `${firstName} ${lastName}`.trim();
    const jobTitle = String(body.job_title ?? "").trim();
    const agentType = body.agent_type as string;
    const slug =
      String(body.slug ?? "").trim() || toSlug(fullName);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }
    if (!["COMMERCIAL", "RESIDENTIAL", "BOTH"].includes(agentType)) {
      return NextResponse.json(
        { error: "Invalid agent_type. Use COMMERCIAL, RESIDENTIAL, or BOTH" },
        { status: 400 }
      );
    }

    const existing = await prisma.agent.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `An agent with slug "${slug}" already exists. Use a unique slug.` },
        { status: 409 }
      );
    }

    // Upload external profile/cover image URLs to our S3 so we own the asset and avoid next/image host issues
    let profileImage = body.profile_image ? String(body.profile_image).trim() || null : null;
    let coverImage = body.cover_image ? String(body.cover_image).trim() || null : null;
    if (profileImage && !isOurStorageUrl(profileImage)) {
      try {
        profileImage = await uploadImageFromUrl(profileImage, "profile");
      } catch (e) {
        console.error("Agent profile_image upload from URL failed:", e);
        return NextResponse.json(
          { error: "Could not fetch and store profile image. Check the URL is public and try again." },
          { status: 400 }
        );
      }
    }
    if (coverImage && !isOurStorageUrl(coverImage)) {
      try {
        coverImage = await uploadImageFromUrl(coverImage, "cover");
      } catch (e) {
        console.error("Agent cover_image upload from URL failed:", e);
        return NextResponse.json(
          { error: "Could not fetch and store cover image. Check the URL is public and try again." },
          { status: 400 }
        );
      }
    }

    const agent = await prisma.agent.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        job_title: jobTitle || "Real Estate Agent",
        agent_type: agentType as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
        slug,
        email: body.email ? String(body.email).trim() || null : null,
        phone: body.phone ? String(body.phone).trim() || null : null,
        website_url: body.website_url ? String(body.website_url).trim() || null : null,
        profile_image: profileImage,
        cover_image: coverImage,
        about_agent: body.about_agent ? String(body.about_agent).trim() || null : null,
        tagline: body.tagline ? String(body.tagline).trim() || null : null,
        primary_focus: body.primary_focus ? String(body.primary_focus).trim() || null : null,
        industry_role: body.industry_role ? String(body.industry_role).trim() || null : null,
        property_specialties: Array.isArray(body.property_specialties)
          ? body.property_specialties.map((s: unknown) => String(s).trim()).filter(Boolean)
          : [],
        languages_spoken: Array.isArray(body.languages_spoken)
          ? body.languages_spoken.map((s: unknown) => String(s).trim()).filter(Boolean)
          : [],
        sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
        status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        allow_contact_form: body.allow_contact_form !== false,
        allow_reviews: body.allow_reviews !== false,
        verified_agent: body.verified_agent === true,
        response_time: body.response_time ? String(body.response_time).trim() || null : null,
      },
    });

    // Optional: create social_links row if provided
    if (
      body.linkedin ||
      body.facebook ||
      body.instagram ||
      body.twitter ||
      body.youtube
    ) {
      await prisma.agentSocialLinks.create({
        data: {
          agentId: agent.id,
          linkedin: body.linkedin ? String(body.linkedin).trim() || null : null,
          facebook: body.facebook ? String(body.facebook).trim() || null : null,
          instagram: body.instagram ? String(body.instagram).trim() || null : null,
          twitter: body.twitter ? String(body.twitter).trim() || null : null,
          youtube: body.youtube ? String(body.youtube).trim() || null : null,
        },
      });
    }

    const created = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: { social_links: true },
    });

    return NextResponse.json({ agent: created });
  } catch (error) {
    if (isAgentTableMissing(error)) {
      return NextResponse.json(
        { error: AGENT_TABLE_MISSING_MESSAGE },
        { status: 503 }
      );
    }
    console.error("Admin agents POST error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
