"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
          // Continue polling
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
  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status?.status === "complete" ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Processing Complete
            </>
          ) : error || status?.status === "failed" ? (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Processing Failed
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Content
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {progress?.stage || "Initializing..."}
              </span>
              <Badge variant="secondary">
                {progress?.current || 0} / {progress?.total || 0} URLs
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
