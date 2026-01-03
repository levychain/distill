"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { StatusResponse } from "@/types";

interface ProcessingStatusProps {
  sessionId: string;
  onComplete: (result: StatusResponse["result"]) => void;
  onError: (error: string) => void;
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

  return (
    <div className="text-center py-16 space-y-6">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-muted-foreground">
        {progress?.stage || "Processing..."}
      </p>
    </div>
  );
}
