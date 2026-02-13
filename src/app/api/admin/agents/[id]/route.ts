import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth-utils";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import { isOurStorageUrl, toDirectS3UrlIfNeeded, uploadImageFromUrl } from "@/lib/s3";

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

// GET - Fetch single agent by id or slug (admin only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(_request);
    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id: identifier } = await params;
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        social_links: true,
        stats: true,
        service_areas: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const social = agent.social_links;
    const stats = agent.stats;
    const payload = {
      agent: {
        id: String(agent.id),
        first_name: String(agent.first_name ?? ""),
        last_name: String(agent.last_name ?? ""),
        full_name: String(agent.full_name ?? ""),
        job_title: String(agent.job_title ?? ""),
        agent_type: agent.agent_type,
        slug: String(agent.slug ?? ""),
        sort_order: agent.sort_order,
        email: agent.email != null ? String(agent.email) : "",
        phone: agent.phone != null ? String(agent.phone) : "",
        website_url: agent.website_url != null ? String(agent.website_url) : "",
        profile_image: toDirectS3UrlIfNeeded(agent.profile_image) ?? (agent.profile_image != null ? String(agent.profile_image) : ""),
        cover_image: toDirectS3UrlIfNeeded(agent.cover_image) ?? (agent.cover_image != null ? String(agent.cover_image) : ""),
        about_agent: agent.about_agent != null ? String(agent.about_agent) : "",
        tagline: agent.tagline != null ? String(agent.tagline) : "",
        primary_focus: agent.primary_focus != null ? String(agent.primary_focus) : "",
        industry_role: agent.industry_role != null ? String(agent.industry_role) : "",
        property_specialties: Array.isArray(agent.property_specialties)
          ? agent.property_specialties.map((s) => String(s))
          : [],
        languages_spoken: Array.isArray(agent.languages_spoken)
          ? agent.languages_spoken.map((s) => String(s))
          : [],
        status: agent.status,
        allow_contact_form: agent.allow_contact_form,
        allow_reviews: agent.allow_reviews,
        response_time: agent.response_time != null ? String(agent.response_time) : "",
        verified_agent: agent.verified_agent,
        years_experience: stats?.years_experience ?? 0,
        total_properties_sold: stats?.total_properties_sold ?? 0,
        active_listings_count: stats?.active_listings_count ?? 0,
        service_areas: (agent.service_areas ?? []).map((a) => a.area_name),
        social_links: social
          ? {
              linkedin: social.linkedin != null ? String(social.linkedin) : "",
              facebook: social.facebook != null ? String(social.facebook) : "",
              instagram: social.instagram != null ? String(social.instagram) : "",
              twitter: social.twitter != null ? String(social.twitter) : "",
              youtube: social.youtube != null ? String(social.youtube) : "",
            }
          : {
              linkedin: "",
              facebook: "",
              instagram: "",
              twitter: "",
              youtube: "",
            },
      },
    };
    return NextResponse.json(payload);
  } catch (error) {
    if (isAgentTableMissing(error)) {
      return NextResponse.json(
        { error: AGENT_TABLE_MISSING_MESSAGE },
        { status: 503 }
      );
    }
    console.error("Admin agents GET [id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// PATCH - Update agent (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: identifier } = await params;
    const existing = await prisma.agent.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: { stats: true, social_links: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const id = existing.id;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const firstName = String(body.first_name ?? existing.first_name).trim();
    const lastName = String(body.last_name ?? existing.last_name).trim();
    const fullName =
      String(body.full_name ?? "").trim() ||
      `${firstName} ${lastName}`.trim();
    const jobTitle =
      String(body.job_title ?? existing.job_title).trim() ||
      "Real Estate Agent";
    const agentType = body.agent_type ?? existing.agent_type;
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

    // If slug changed, ensure it's unique (excluding current agent)
    if (slug !== existing.slug) {
      const slugTaken = await prisma.agent.findFirst({
        where: { slug, id: { not: existing.id } },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: `An agent with slug "${slug}" already exists. Use a unique slug.` },
          { status: 409 }
        );
      }
    }

    // Upload external profile/cover image URLs to our S3 when provided
    let profileImage: string | null | undefined =
      body.profile_image != null ? (String(body.profile_image).trim() || null) : undefined;
    let coverImage: string | null | undefined =
      body.cover_image != null ? (String(body.cover_image).trim() || null) : undefined;
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

    await prisma.agent.update({
      where: { id },
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        job_title: jobTitle,
        agent_type: agentType as "COMMERCIAL" | "RESIDENTIAL" | "BOTH",
        slug,
        email: body.email != null ? (String(body.email).trim() || null) : undefined,
        phone: body.phone != null ? (String(body.phone).trim() || null) : undefined,
        website_url: body.website_url != null ? (String(body.website_url).trim() || null) : undefined,
        profile_image: profileImage,
        cover_image: coverImage,
        about_agent: body.about_agent != null ? (String(body.about_agent).trim() || null) : undefined,
        tagline: body.tagline != null ? (String(body.tagline).trim() || null) : undefined,
        primary_focus: body.primary_focus != null ? (String(body.primary_focus).trim() || null) : undefined,
        industry_role: body.industry_role != null ? (String(body.industry_role).trim() || null) : undefined,
        property_specialties: Array.isArray(body.property_specialties)
          ? body.property_specialties.map((s: unknown) => String(s).trim()).filter(Boolean)
          : undefined,
        languages_spoken: Array.isArray(body.languages_spoken)
          ? body.languages_spoken.map((s: unknown) => String(s).trim()).filter(Boolean)
          : undefined,
        sort_order:
          typeof body.sort_order === "number"
            ? body.sort_order
            : body.sort_order != null
              ? parseInt(String(body.sort_order), 10) || 0
              : undefined,
        status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        allow_contact_form: body.allow_contact_form !== false,
        allow_reviews: body.allow_reviews !== false,
        verified_agent: body.verified_agent === true,
        response_time: body.response_time != null ? (String(body.response_time).trim() || null) : undefined,
      },
    });

    // Upsert social_links
    const socialPayload = {
      linkedin: body.linkedin != null ? (String(body.linkedin).trim() || null) : undefined,
      facebook: body.facebook != null ? (String(body.facebook).trim() || null) : undefined,
      instagram: body.instagram != null ? (String(body.instagram).trim() || null) : undefined,
      twitter: body.twitter != null ? (String(body.twitter).trim() || null) : undefined,
      youtube: body.youtube != null ? (String(body.youtube).trim() || null) : undefined,
    };
    const hasSocial = Object.values(socialPayload).some((v) => v !== undefined && v !== null);

    if (hasSocial || existing.social_links) {
      await prisma.agentSocialLinks.upsert({
        where: { agentId: id },
        create: {
          agentId: id,
          linkedin: socialPayload.linkedin ?? null,
          facebook: socialPayload.facebook ?? null,
          instagram: socialPayload.instagram ?? null,
          twitter: socialPayload.twitter ?? null,
          youtube: socialPayload.youtube ?? null,
        },
        update: {
          ...(socialPayload.linkedin !== undefined && { linkedin: socialPayload.linkedin }),
          ...(socialPayload.facebook !== undefined && { facebook: socialPayload.facebook }),
          ...(socialPayload.instagram !== undefined && { instagram: socialPayload.instagram }),
          ...(socialPayload.twitter !== undefined && { twitter: socialPayload.twitter }),
          ...(socialPayload.youtube !== undefined && { youtube: socialPayload.youtube }),
        },
      });
    }

    // Upsert stats
    const yearsExp =
      typeof body.years_experience === "number"
        ? body.years_experience
        : body.years_experience != null
          ? parseInt(String(body.years_experience), 10) || 0
          : undefined;
    const totalSold =
      typeof body.total_properties_sold === "number"
        ? body.total_properties_sold
        : body.total_properties_sold != null
          ? parseInt(String(body.total_properties_sold), 10) || 0
          : undefined;
    const activeListings =
      typeof body.active_listings_count === "number"
        ? body.active_listings_count
        : body.active_listings_count != null
          ? parseInt(String(body.active_listings_count), 10) || 0
          : undefined;
    if (
      yearsExp !== undefined ||
      totalSold !== undefined ||
      activeListings !== undefined ||
      existing.stats
    ) {
      const statsData = {
        years_experience: yearsExp ?? existing.stats?.years_experience ?? 0,
        total_properties_sold: totalSold ?? existing.stats?.total_properties_sold ?? 0,
        active_listings_count: activeListings ?? existing.stats?.active_listings_count ?? 0,
      };
      await prisma.agentStats.upsert({
        where: { agentId: id },
        create: { agentId: id, ...statsData },
        update: statsData,
      });
    }

    // Replace service_areas
    if (Array.isArray(body.service_areas)) {
      await prisma.agentServiceArea.deleteMany({ where: { agentId: id } });
      const areas = body.service_areas
        .map((a: unknown) => String(a).trim())
        .filter(Boolean);
      if (areas.length > 0) {
        await prisma.agentServiceArea.createMany({
          data: areas.map((area_name: string) => ({ agentId: id, area_name })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.agent.findUnique({
      where: { id },
      include: { social_links: true, stats: true, service_areas: true },
    });

    return NextResponse.json({ agent: updated });
  } catch (error) {
    if (isAgentTableMissing(error)) {
      return NextResponse.json(
        { error: AGENT_TABLE_MISSING_MESSAGE },
        { status: 503 }
      );
    }
    console.error("Admin agents PATCH [id] error:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE - Remove agent (admin only); related records are removed by DB cascade
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(_request);
    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id: identifier } = await params;
    const existing = await prisma.agent.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isAgentTableMissing(error)) {
      return NextResponse.json(
        { error: AGENT_TABLE_MISSING_MESSAGE },
        { status: 503 }
      );
    }
    console.error("Admin agents DELETE [id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
