import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";
import type { StatusResponse } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const response: StatusResponse = {
      status: session.status,
      progress: session.progress,
      error: session.error,
    };

    if (session.status === "complete" && session.summary) {
      response.result = {
        topicName: session.topicName,
        notionPageUrl: session.notionPageUrl || "",
        summary: session.summary,
        urls: session.urls,
        transcripts: session.transcripts || [],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
