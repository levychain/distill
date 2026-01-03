import type { Platform, UrlInfo } from "@/types";

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
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((url) => {
    const platform = detectPlatform(url);
    const id = extractVideoId(url, platform);
    return { url, platform, id: id ?? undefined };
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
