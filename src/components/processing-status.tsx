"use client";

import { useEffect, useState } from "react";
import type { StatusResponse } from "@/types";

interface ProcessingStatusProps {
  sessionId: string;
  onComplete: (result: StatusResponse["result"]) => void;
  onError: (error: string) => void;
}

function formatStage(stage: string | undefined): string {
  if (!stage) return "Processing";
  
  // Remove mentions of "Claude" or technical details
  if (stage.toLowerCase().includes('claude')) return "Generating summary";
  if (stage.toLowerCase().includes('summary')) return "Almost done";
  
  // Clean up the stage text - remove (x/y) since we show it separately
  let cleaned = stage.replace(/\s*\(\d+\/\d+\)\s*/g, '').trim();
  
  // Capitalize platform names
  cleaned = cleaned.replace(/tiktok/gi, 'TikTok')
    .replace(/youtube/gi, 'YouTube')
    .replace(/instagram/gi, 'Instagram');
  
  return cleaned;
}

export function ProcessingStatus({
  sessionId,
  onComplete,
  onError,
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/status/${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const data: StatusResponse = await response.json();

        if (!mounted) return;

        setStatus(data);

        if (data.status === "complete" && data.result) {
          onComplete(data.result);
        } else if (data.status === "failed") {
          setError(data.error || "Processing failed");
          onError(data.error || "Processing failed");
        } else if (data.status === "processing" || data.status === "pending") {
          timeoutId = setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        onError(errorMessage);
      }
    };

    pollStatus();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, onComplete, onError]);

  const progress = status?.progress;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const current = progress?.current ?? 0;
  const total = progress?.total ?? 1;
  const stageText = formatStage(progress?.stage);

  return (
    <div className="text-center py-20 space-y-8">
      {/* Simple pulsing dots */}
      <div className="flex items-center justify-center gap-2">
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '150ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: '300ms' }}
        />
      </div>

      {/* Stage text */}
      <div className="space-y-1">
        <p className="text-lg font-medium">{stageText}</p>
        {total > 1 && (
          <p className="text-sm text-muted-foreground">
            {current} of {total}
          </p>
        )}
      </div>
    </div>
  );
}
