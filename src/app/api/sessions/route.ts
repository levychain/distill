import { NextRequest, NextResponse } from "next/server";
import { getAllSessions } from "@/lib/session-store";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessions = getAllSessions();

    // Return simplified session list
    const sessionList = sessions.map((s) => ({
      id: s.id,
      topicName: s.topicName,
      status: s.status,
      urlCount: s.urls.length,
      notionPageUrl: s.notionPageUrl,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ sessions: sessionList });
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}
