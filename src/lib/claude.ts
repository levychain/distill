import Anthropic from "@anthropic-ai/sdk";
import type { SummaryResult, TranscriptResult } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const STUDY_PROMPT = `You are helping me study and deeply understand content I've collected from the internet.

I've gathered transcripts from multiple videos/posts on a related topic. Please analyze them and provide:

## Summary
A clear, comprehensive summary of the key information across all sources. What are they teaching? What's the core message?

## Key Takeaways
The most important points I should remember, formatted as a numbered list.

## How to Apply This
Practical steps I can take to apply this knowledge. Be specific and actionable.

## Study Questions
5-10 questions I can ask myself to test my understanding of this material.

## Connections and Patterns
What themes or patterns appear across multiple sources? Where do the sources agree or disagree?

---

Here are the transcripts:

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
  // Split by ## headers
  const sections: Record<string, string> = {};
  const headerRegex = /^## (.+)$/gm;
  let lastHeader = "";
  let lastIndex = 0;

  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    if (lastHeader && lastIndex > 0) {
      sections[lastHeader.toLowerCase()] = text
        .slice(lastIndex, match.index)
        .trim();
    }
    lastHeader = match[1];
    lastIndex = match.index + match[0].length;
  }

  // Get the last section
  if (lastHeader) {
    sections[lastHeader.toLowerCase()] = text.slice(lastIndex).trim();
  }

  return {
    summary: sections["summary"] || "",
    keyTakeaways: sections["key takeaways"] || "",
    howToApply: sections["how to apply this"] || "",
    studyQuestions: sections["study questions"] || "",
    connectionsAndPatterns: sections["connections and patterns"] || "",
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
