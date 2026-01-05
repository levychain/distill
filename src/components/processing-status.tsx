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

// Skeleton that previews the results layout
function ResultsSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-pulse">
      {/* Source pills skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 bg-secondary/40 rounded-full" />
        <div className="h-8 w-24 bg-secondary/40 rounded-full" />
        <div className="h-8 w-16 bg-secondary/40 rounded-full" />
      </div>

      {/* Summary skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-16 bg-secondary/40 rounded" />
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 mt-2 shrink-0" />
            <div className="h-5 flex-1 bg-secondary/40 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 mt-2 shrink-0" />
            <div className="h-5 w-3/4 bg-secondary/40 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 mt-2 shrink-0" />
            <div className="h-5 w-5/6 bg-secondary/40 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 mt-2 shrink-0" />
            <div className="h-5 w-2/3 bg-secondary/40 rounded" />
          </div>
        </div>
      </div>

      {/* Transcript toggle skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-5 w-24 bg-secondary/40 rounded" />
        <div className="h-5 w-12 bg-secondary/40 rounded" />
      </div>

      {/* Action button skeleton */}
      <div className="pt-4 border-t border-border/30">
        <div className="h-11 bg-secondary/40 rounded-xl" />
      </div>

      {/* Chat skeleton */}
      <div className="pt-4">
        <div className="rounded-2xl border border-border/30 bg-secondary/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <div className="h-3 w-24 bg-secondary/40 rounded" />
          </div>
          <div className="h-[200px] p-5">
            <div className="h-4 w-48 bg-secondary/30 rounded mx-auto mt-16" />
          </div>
          <div className="p-3 border-t border-border/30">
            <div className="h-11 bg-secondary/40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="space-y-10">
      {/* Progress header */}
      <div className="text-center space-y-4">
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

      {/* Results skeleton preview */}
      <ResultsSkeleton />
    </div>
  );
}
