import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSession } from "@/lib/session-store";
import type { StatusResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication
    const authSession = await getServerSession(authOptions);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/e7e98a94-ed7b-4ddd-89ab-dcfb07735794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'status/route.ts:before-get',message:'Status API looking up session',data:{sessionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    const session = getSession(sessionId);

    if (!session) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e7e98a94-ed7b-4ddd-89ab-dcfb07735794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'status/route.ts:not-found',message:'Session NOT FOUND - returning 404',data:{sessionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
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
        notionPageUrl: session.notionPageUrl || "",
        summary: session.summary,
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
