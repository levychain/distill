import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseUrls } from "@/lib/url-detector";
import { createStudyPage, updateStudyPage, updatePageStatus } from "@/lib/notion";
import { downloadAudio, fetchTweetText } from "@/lib/video-downloader";
import { transcribeAudio } from "@/lib/assemblyai";
import { generateStudySummary, generateTopicName } from "@/lib/claude";
import {
  createSession,
  updateSession,
  generateSessionId,
} from "@/lib/session-store";
import type { ProcessRequest, TranscriptResult } from "@/types";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProcessRequest = await request.json();
    const { urls, topicName } = body;

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 URLs allowed" },
        { status: 400 }
      );
    }

    // Parse URLs and detect platforms
    const urlInfos = parseUrls(urls.join("\n"));
    const validUrls = urlInfos.filter((u) => u.platform !== "unknown");

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs detected. Supported platforms: YouTube, X/Twitter, TikTok, Instagram" },
        { status: 400 }
      );
    }

    // Use provided topic name or generate one later
    const sessionTopicName = topicName || "Processing...";

    // Create Notion page
    const { pageId, pageUrl } = await createStudyPage(
      sessionTopicName,
      validUrls.map((u) => u.url)
    );

    // Create session
    const sessionId = generateSessionId();
    createSession(
      sessionId,
      sessionTopicName,
      validUrls.map((u) => u.url),
      pageId,
      pageUrl
    );

    // Start async processing
    processUrlsAsync(sessionId, validUrls, pageId, topicName);

    return NextResponse.json({
      sessionId,
      notionPageId: pageId,
      notionPageUrl: pageUrl,
    });
  } catch (error) {
    console.error("Process API error:", error);
    return NextResponse.json(
      { error: "Failed to start processing" },
      { status: 500 }
    );
  }
}

async function processUrlsAsync(
  sessionId: string,
  urlInfos: Array<{ url: string; platform: string; id?: string }>,
  notionPageId: string,
  providedTopicName?: string
) {
  const transcripts: TranscriptResult[] = [];

  try {
    updateSession(sessionId, {
      status: "processing",
      progress: {
        current: 0,
        total: urlInfos.length,
        stage: "Starting transcription",
      },
    });

    // Process each URL
    for (let i = 0; i < urlInfos.length; i++) {
      const urlInfo = urlInfos[i];

      updateSession(sessionId, {
        progress: {
          current: i,
          total: urlInfos.length,
          stage: `Transcribing ${urlInfo.platform} (${i + 1}/${urlInfos.length})`,
        },
      });

      try {
        let transcript = "";

        // Handle text tweets separately
        if (urlInfo.platform === "twitter") {
          const tweetText = await fetchTweetText(urlInfo.url);
          if (tweetText) {
            transcript = tweetText;
          }
        }

        // If no text (or not a text tweet), download and transcribe
        if (!transcript) {
          const { audioPath, cleanup } = await downloadAudio(
            urlInfo.url,
            urlInfo.platform as any
          );

          try {
            transcript = await transcribeAudio(audioPath);
          } finally {
            await cleanup();
          }
        }

        transcripts.push({
          url: urlInfo.url,
          platform: urlInfo.platform as any,
          transcript,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing ${urlInfo.url}:`, error);
        transcripts.push({
          url: urlInfo.url,
          platform: urlInfo.platform as any,
          transcript: "",
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        });
      }
    }

    // Check if we have any successful transcripts
    const successfulTranscripts = transcripts.filter((t) => t.success);

    if (successfulTranscripts.length === 0) {
      updateSession(sessionId, {
        status: "failed",
        error: "All URLs failed to process",
        transcripts,
      });
      await updatePageStatus(notionPageId, "Failed");
      return;
    }

    // Generate topic name if not provided
    updateSession(sessionId, {
      progress: {
        current: urlInfos.length,
        total: urlInfos.length,
        stage: "Generating summary with Claude",
      },
    });

    const finalTopicName =
      providedTopicName || (await generateTopicName(transcripts));

    // Generate summary with Claude
    const summary = await generateStudySummary(transcripts, finalTopicName);

    // Update Notion page with content and final title
    await updateStudyPage(notionPageId, transcripts, summary, "Complete", finalTopicName);

    // Update session with results
    updateSession(sessionId, {
      status: "complete",
      topicName: finalTopicName,
      transcripts,
      summary,
      progress: {
        current: urlInfos.length,
        total: urlInfos.length,
        stage: "Complete",
      },
    });
  } catch (error) {
    console.error("Processing error:", error);
    updateSession(sessionId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      transcripts,
    });
    await updatePageStatus(notionPageId, "Failed");
  }
}
