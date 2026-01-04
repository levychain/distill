import { exec } from "child_process";
import { promisify } from "util";
import { unlink, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { Platform } from "@/types";

const execAsync = promisify(exec);

const TEMP_DIR = "/tmp/content-study-tool";

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function downloadAudio(
  url: string,
  platform: Platform
): Promise<{ audioPath: string; cleanup: () => Promise<void> }> {
  await ensureTempDir();

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const outputPath = path.join(TEMP_DIR, `${timestamp}-${randomId}.mp3`);

  try {
    // Use yt-dlp which works for YouTube, TikTok, Twitter, and Instagram
    const command = buildDownloadCommand(url, outputPath, platform);
    await execAsync(command, { timeout: 300000 }); // 5 minute timeout

    return {
      audioPath: outputPath,
      cleanup: async () => {
        try {
          await unlink(outputPath);
        } catch {
          // Ignore cleanup errors
        }
      },
    };
  } catch (error) {
    // Clean up on error
    try {
      await unlink(outputPath);
    } catch {
      // Ignore
    }
    throw error;
  }
}

function buildDownloadCommand(
  url: string,
  outputPath: string,
  platform: Platform
): string {
  // Base yt-dlp command for extracting audio
  const baseCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --no-playlist`;

  // Platform-specific options
  switch (platform) {
    case "twitter":
      // Twitter/X may need cookies or specific user agent
      return `${baseCommand} --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${url}"`;

    case "tiktok":
      // TikTok may need specific handling
      return `${baseCommand} --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${url}"`;

    case "instagram":
      // Instagram may require login for some content
      return `${baseCommand} --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${url}"`;

    case "youtube":
    default:
      return `${baseCommand} "${url}"`;
  }
}

export async function getVideoInfo(url: string): Promise<{
  title: string;
  duration: number;
  description?: string;
}> {
  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "${url}"`,
      { timeout: 60000 }
    );

    const info = JSON.parse(stdout);

    return {
      title: info.title || "Unknown Title",
      duration: info.duration || 0,
      description: info.description,
    };
  } catch {
    return {
      title: "Unknown Title",
      duration: 0,
    };
  }
}

export async function downloadVideoAsFile(
  url: string
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  await ensureTempDir();

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const outputPath = path.join(TEMP_DIR, `${timestamp}-${randomId}.mp4`);

  try {
    await execAsync(
      `yt-dlp -f "best[ext=mp4]/best" -o "${outputPath}" --no-playlist "${url}"`,
      { timeout: 300000 }
    );

    return {
      filePath: outputPath,
      cleanup: async () => {
        try {
          await unlink(outputPath);
        } catch {
          // Ignore cleanup errors
        }
      },
    };
  } catch (error) {
    try {
      await unlink(outputPath);
    } catch {
      // Ignore
    }
    throw error;
  }
}

// For text-only tweets
export async function fetchTweetText(tweetUrl: string): Promise<string | null> {
  try {
    // Use yt-dlp to get tweet info
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "${tweetUrl}"`,
      { timeout: 30000 }
    );

    const info = JSON.parse(stdout);

    // If there's a description but no video, it's a text tweet
    if (info.description && !info.formats?.length) {
      return info.description;
    }

    return null;
  } catch {
    return null;
  }
}

// For Farcaster casts
export async function fetchFarcasterCast(castUrl: string): Promise<string | null> {
  try {
    // Extract username and cast hash from URL
    // Supports: farcaster.xyz/user/hash and warpcast.com/user/hash
    const match = castUrl.match(/(?:farcaster\.xyz|warpcast\.com)\/([^\/]+)\/([a-zA-Z0-9x]+)/i);
    if (!match) return null;

    const [, username, hash] = match;

    // Method 1: Try Neynar API with env key (use type=url since we only have short hash)
    const neynarApiKey = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DOCS';
    const neynarCastUrl = `https://warpcast.com/${username}/${hash}`;
    const neynarUrl = `https://api.neynar.com/v2/farcaster/cast?identifier=${encodeURIComponent(neynarCastUrl)}&type=url`;

    try {
      const neynarResponse = await fetch(neynarUrl, {
        headers: {
          'Accept': 'application/json',
          'api_key': neynarApiKey,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (neynarResponse.ok) {
        const data = await neynarResponse.json();
        if (data?.cast?.text) {
          const author = data.cast.author?.display_name || data.cast.author?.username || username;
          return `[Cast by @${author}]\n\n${data.cast.text}`;
        }
      }
    } catch (e) {
      // Continue to fallback
    }

    // Fallback: try to scrape from warpcast meta tags
    const warpcastUrl = `https://warpcast.com/${username}/${hash}`;
    const response = await fetch(warpcastUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const html = await response.text();

      // Try og:description
      const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      if (ogDescMatch) return ogDescMatch[1];

      // Try twitter:description
      const twitterDescMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]+)"/i);
      if (twitterDescMatch) return twitterDescMatch[1];

      // Try description meta tag
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      if (descMatch) return descMatch[1];
    }

    return null;
  } catch (error) {
    console.error('Farcaster fetch error:', error);
    return null;
  }
}

export async function uploadToTemporaryStorage(
  filePath: string
): Promise<string> {
  // For AssemblyAI, we can use their upload endpoint
  // This is a placeholder - in production, you'd upload to AssemblyAI or S3
  // For now, we'll use the local file path and AssemblyAI's file upload feature

  // AssemblyAI can accept local file paths when using their SDK
  return filePath;
}
