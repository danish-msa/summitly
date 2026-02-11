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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!agentId || !name || !email || !message) {
      return NextResponse.json(
        { error: "agentId, name, email, and message are required" },
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
