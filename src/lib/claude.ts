import Anthropic from "@anthropic-ai/sdk";
import type { SummaryResult, TranscriptResult } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const STUDY_PROMPT = `Distill this content into 3-5 key takeaways.

RULES:
- Each point on its own line
- Start each with "• " (bullet)
- One sentence per bullet, max 15 words
- No intro text, just bullets
- No markdown

---

Content:

`;

export async function generateStudySummary(
  transcripts: TranscriptResult[],
  topicName?: string
): Promise<SummaryResult> {
  const successfulTranscripts = transcripts.filter((t) => t.success);

  if (successfulTranscripts.length === 0) {
    throw new Error("No successful transcripts to summarize");
  }

  // Format transcripts with source info
  const formattedTranscripts = successfulTranscripts
    .map(
      (t, index) =>
        `### Source ${index + 1}: ${t.platform.toUpperCase()}\nURL: ${t.url}\n\n${t.transcript}`
    )
    .join("\n\n---\n\n");

  const topicContext = topicName
    ? `The topic is: "${topicName}"\n\n`
    : "";

  const fullPrompt = topicContext + STUDY_PROMPT + formattedTranscripts;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const text = content.text;

    // Parse the response into sections
    return parseClaudeResponse(text);
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

function parseClaudeResponse(text: string): SummaryResult {
  // Just return the raw bullet list
  return {
    summary: text.trim(),
    keyTakeaways: "",
    howToApply: "",
    connectionsAndPatterns: "",
  };
}

export async function generateTopicName(
  transcripts: TranscriptResult[]
): Promise<string> {
  const successfulTranscripts = transcripts.filter((t) => t.success);

  if (successfulTranscripts.length === 0) {
    return "Study Session";
  }

  // Use first 500 characters of first transcript for topic generation
  const sampleText = successfulTranscripts[0].transcript.slice(0, 500);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Based on this transcript excerpt, generate a concise topic title (MAXIMUM 5 words) that describes what this content is about. Be specific and descriptive. Only respond with the title, nothing else.\n\nTranscript: ${sampleText}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return "Study Session";
    }

    // Enforce max 5 words
    const title = content.text.trim();
    const words = title.split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(" ");
    }

    return title || "Study Session";
  } catch {
    return "Study Session";
  }
}
