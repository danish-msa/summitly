import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth-utils";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

async function updateAgentReviewAggregates(agentId: string) {
  const reviews = await prisma.agentReview.findMany({
    where: { agentId },
    select: { rating: true },
  });
  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const overall_rating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  await prisma.agent.update({
    where: { id: agentId },
    data: { overall_rating, total_reviews_count: total },
  });
}

/** POST - Create a review for an agent (admin only) */
export async function POST(
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
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const reviewer_name =
      typeof body.reviewer_name === "string" ? body.reviewer_name.trim() : "";
    const rating =
      typeof body.rating === "number"
        ? body.rating
        : typeof body.rating === "string"
          ? parseInt(body.rating, 10)
          : NaN;
    const review_text =
      typeof body.review_text === "string" ? body.review_text.trim() : "";

    if (!reviewer_name || !review_text) {
      return NextResponse.json(
        { error: "reviewer_name and review_text are required" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.agentReview.create({
      data: {
        agentId: agent.id,
        reviewer_name,
        rating,
        review_text,
      },
    });

    await updateAgentReviewAggregates(agent.id);

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        review_text: review.review_text,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin agent review create error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
