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

/** DELETE - Remove a review (admin only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
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

    const { reviewId } = await params;
    const review = await prisma.agentReview.findUnique({
      where: { id: reviewId },
      select: { id: true, agentId: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.agentReview.delete({ where: { id: reviewId } });
    await updateAgentReviewAggregates(review.agentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin agent review delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
