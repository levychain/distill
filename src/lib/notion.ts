import { Client } from "@notionhq/client";
import type { SummaryResult, TranscriptResult } from "@/types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

export async function createStudyPage(
  topicName: string,
  urls: string[]
): Promise<{ pageId: string; pageUrl: string }> {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: topicName,
              },
            },
          ],
        },
        "Source URLs": {
          rich_text: [
            {
              text: {
                content: urls.join("\n"),
              },
            },
          ],
        },
        Status: {
          select: {
            name: "Processing",
          },
        },
      },
    });

    return {
      pageId: response.id,
      pageUrl: `https://notion.so/${response.id.replace(/-/g, "")}`,
    };
  } catch (error) {
    console.error("Notion create page error:", error);
    throw error;
  }
}

export async function updateStudyPage(
  pageId: string,
  transcripts: TranscriptResult[],
  summary: SummaryResult,
  status: "Complete" | "Failed",
  topicName?: string
): Promise<void> {
  try {
    // Update the page status and title
    const updateProps: any = {
      Status: {
        select: {
          name: status,
        },
      },
    };

    // Update the title if provided
    if (topicName) {
      updateProps.Name = {
        title: [
          {
            text: {
              content: topicName,
            },
          },
        ],
      };
    }

    await notion.pages.update({
      page_id: pageId,
      properties: updateProps,
    });

    // Build the page content blocks
    const blocks = buildPageContent(transcripts, summary);

    // Append blocks to the page
    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    });
  } catch (error) {
    console.error("Notion update page error:", error);
    throw error;
  }
}

function buildPageContent(
  transcripts: TranscriptResult[],
  summary: SummaryResult
): any[] {
  const blocks: any[] = [];

  // Source URLs section
  blocks.push({
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: "Source URLs" } }],
    },
  });

  transcripts.forEach((t) => {
    blocks.push({
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `${t.platform.toUpperCase()}: ${t.url}`,
              link: { url: t.url },
            },
          },
          {
            type: "text",
            text: {
              content: t.success ? " (transcribed)" : ` (failed: ${t.error})`,
            },
          },
        ],
      },
    });
  });

  // Divider
  blocks.push({ type: "divider", divider: {} });

  // TLDR section
  blocks.push({
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: "TLDR" } }],
    },
  });

  addTextBlock(blocks, summary.summary);


  // Divider
  blocks.push({ type: "divider", divider: {} });

  // Combined Transcript section
  blocks.push({
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: "Combined Transcript" } }],
    },
  });

  const successfulTranscripts = transcripts.filter((t) => t.success);
  successfulTranscripts.forEach((t, index) => {
    blocks.push({
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: { content: `Source ${index + 1}: ${t.platform.toUpperCase()}` },
          },
        ],
      },
    });

    addTextBlock(blocks, t.transcript);
  });

  // Processed timestamp
  blocks.push({ type: "divider", divider: {} });
  blocks.push({
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: `Processed on ${new Date().toLocaleString()}`,
          },
          annotations: {
            italic: true,
            color: "gray",
          },
        },
      ],
    },
  });

  return blocks;
}

function addTextBlock(blocks: any[], text: string): void {
  // Notion has a 2000 character limit per rich_text block
  const MAX_LENGTH = 1900;
  
  if (!text || text.trim().length === 0) return;

  // Split text into chunks that fit within Notion's limit
  let remaining = text;
  
  while (remaining.length > 0) {
    let chunk: string;
    
    if (remaining.length <= MAX_LENGTH) {
      chunk = remaining;
      remaining = "";
    } else {
      // Try to split at a newline or space
      let splitIndex = remaining.lastIndexOf("\n", MAX_LENGTH);
      if (splitIndex === -1 || splitIndex < MAX_LENGTH / 2) {
        splitIndex = remaining.lastIndexOf(" ", MAX_LENGTH);
      }
      if (splitIndex === -1 || splitIndex < MAX_LENGTH / 2) {
        // Force split at MAX_LENGTH if no good break point
        splitIndex = MAX_LENGTH;
      }
      
      chunk = remaining.slice(0, splitIndex);
      remaining = remaining.slice(splitIndex).trimStart();
    }
    
    if (chunk.trim()) {
      blocks.push({
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk.trim() } }],
        },
      });
    }
  }
}

export async function updatePageStatus(
  pageId: string,
  status: "Processing" | "Complete" | "Failed"
): Promise<void> {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          select: {
            name: status,
          },
        },
      },
    });
  } catch (error) {
    console.error("Notion update status error:", error);
    throw error;
  }
}
