import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const agentId = body.agentId;
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : `${firstName} ${lastName}`.trim();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const iAmA = typeof body.iAmA === "string" ? body.iAmA.trim() : null;
    const planningTimeline = typeof body.planningTimeline === "string" ? body.planningTimeline.trim() : null;
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!agentId || !name || !email || !message) {
      return NextResponse.json(
        { error: "agentId, name (first + last), email, and message are required" },
        { status: 400 }
      );
    }

    // TODO: Store message (e.g. AgentContactMessage table) or send email to agent
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact agent error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
