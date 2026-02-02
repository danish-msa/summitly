import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AgentListItem } from "@/lib/types/agents";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const rows = await prisma.agent.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sort_order: "asc" }, { full_name: "asc" }],
      include: { social_links: true },
    });

    const agents: AgentListItem[] = rows.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.full_name,
      image: a.profile_image ?? null,
      email: a.email ?? null,
      title: a.job_title,
      specializations: a.property_specialties ?? [],
      languages: a.languages_spoken ?? [],
      phone: a.phone ?? null,
      agent_type: a.agent_type,
      verified_agent: a.verified_agent,
      socialMedia: a.social_links
        ? {
            facebook: a.social_links.facebook ?? undefined,
            twitter: a.social_links.twitter ?? undefined,
            instagram: a.social_links.instagram ?? undefined,
            linkedin: a.social_links.linkedin ?? undefined,
          }
        : undefined,
    }));

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents", agents: [] },
      { status: 500 }
    );
  }
}
