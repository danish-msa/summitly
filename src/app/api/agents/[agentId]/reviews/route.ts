import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
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

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, allow_reviews: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (!agent.allow_reviews) {
      return NextResponse.json(
        { error: "This agent is not accepting reviews" },
        { status: 403 }
      );
    }

    await prisma.agentReview.create({
      data: {
        agentId: agent.id,
        reviewer_name,
        rating,
        review_text,
      },
    });

    const reviews = await prisma.agentReview.findMany({
      where: { agentId: agent.id },
      select: { rating: true },
    });
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const overall_rating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        overall_rating,
        total_reviews_count: total,
      },
    });

    return NextResponse.json({
      success: true,
      overall_rating,
      total_reviews_count: total,
    });
  } catch (error) {
    console.error("Agent review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
