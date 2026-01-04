"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { StatusResponse } from "@/types";

interface ProcessingStatusProps {
  sessionId: string;
  onComplete: (result: StatusResponse["result"]) => void;
  onError: (error: string) => void;
}

function formatStage(stage: string | undefined, current: number, total: number): string {
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
  const stageText = formatStage(progress?.stage, current, total);

  return (
    <div className="text-center py-20 space-y-8">
      {/* Animated pulsing rings */}
      <div className="relative w-16 h-16 mx-auto">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
        />
        <div className="absolute inset-2 rounded-full bg-primary/10" />
      </div>

      {/* Stage text */}
      <motion.div
        key={stageText}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <p className="text-lg font-medium">{stageText}</p>
        {total > 1 && (
          <p className="text-sm text-muted-foreground">
            {current} of {total}
          </p>
        )}
      </motion.div>
    </div>
  );
}
