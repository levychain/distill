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

               if (response.status === 404) {
                 throw new Error("Session not found. The server may have restarted. Please go back and try again.");
               }
               
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
  
  // Calculate progress percentage
  // Each URL has roughly 3 stages: download, transcribe, then final summary
  // So we estimate: (current / total) gives us base progress
  // Add a small amount for the current item being processed
  const baseProgress = total > 0 ? (current / total) * 100 : 0;
  const stageBonus = stageText.toLowerCase().includes('almost') ? 90 : 
                     stageText.toLowerCase().includes('summary') ? 85 :
                     baseProgress + (100 / total) * 0.5;
  const displayProgress = Math.min(Math.max(baseProgress, stageBonus > baseProgress ? stageBonus : baseProgress + 5), 95);

  return (
    <div className="text-center py-20 space-y-8">
      {/* Combined stage + count */}
      <p className="text-lg font-medium text-muted-foreground">
        {stageText}
        {total > 1 && (
          <span className="text-foreground"> · {Math.min(current + 1, total)} of {total}</span>
        )}
      </p>

      {/* Progress bar with shimmer animation */}
      <div className="max-w-xs mx-auto">
        <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ 
              width: `${displayProgress}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)'
            }}
          >
            {/* Shimmer overlay */}
            <div 
              className="absolute inset-0 animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
