import type { Platform, UrlInfo } from "@/types";

export type { UrlInfo };

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

const TWITTER_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/,
  /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/\w+\/statuses\/(\d+)/,
];

const TIKTOK_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
  /(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/(\w+)/,
  /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/(\w+)/,
];

const INSTAGRAM_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
];

export function detectPlatform(url: string): Platform {
  if (YOUTUBE_PATTERNS.some((pattern) => pattern.test(url))) {
    return "youtube";
  }
  if (TWITTER_PATTERNS.some((pattern) => pattern.test(url))) {
    return "twitter";
  }
  if (TIKTOK_PATTERNS.some((pattern) => pattern.test(url))) {
    return "tiktok";
  }
  if (INSTAGRAM_PATTERNS.some((pattern) => pattern.test(url))) {
    return "instagram";
  }
  return "unknown";
}

export function extractVideoId(url: string, platform: Platform): string | null {
  let patterns: RegExp[];

  switch (platform) {
    case "youtube":
      patterns = YOUTUBE_PATTERNS;
      break;
    case "twitter":
      patterns = TWITTER_PATTERNS;
      break;
    case "tiktok":
      patterns = TIKTOK_PATTERNS;
      break;
    case "instagram":
      patterns = INSTAGRAM_PATTERNS;
      break;
    default:
      return null;
  }

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function parseUrls(input: string): UrlInfo[] {
  // Pre-process: join lines that are continuations of URLs (don't start with http)
  const lines = input.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // If this line starts with http, it's a new URL
    if (trimmed.match(/^https?:\/\//i)) {
      processedLines.push(trimmed);
    } else if (processedLines.length > 0) {
      // This line is a continuation - append to previous line
      processedLines[processedLines.length - 1] += trimmed;
    } else {
      // First line doesn't start with http, just add it
      processedLines.push(trimmed);
    }
  }
  
  // Join everything and extract URLs
  const cleanedInput = processedLines.join(' ');
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = cleanedInput.match(urlRegex) || [];
  
  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(matches));

  return uniqueUrls.map((url) => {
    // Clean up any trailing punctuation
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    const platform = detectPlatform(cleanUrl);
    const id = extractVideoId(cleanUrl, platform);
    return { url: cleanUrl, platform, id: id ?? undefined };
  });
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "twitter":
      return "X (Twitter)";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    default:
      return "Unknown";
  }
}
