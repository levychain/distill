"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProcessingStatus } from "@/components/processing-status";
import { ResultsView } from "@/components/results-view";
import { updateLocalHistory, saveSessionResult, getSessionResult } from "@/lib/local-history";
import { ArrowLeft } from "lucide-react";
import type { StatusResponse } from "@/types";

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [result, setResult] = useState<StatusResponse["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, check if we have cached results in localStorage
  useEffect(() => {
    const cached = getSessionResult(sessionId);
    if (cached) {
      setResult({
        topicName: cached.topicName,
        notionPageUrl: cached.notionPageUrl,
        summary: cached.summary,
        urls: cached.urls,
        transcripts: cached.transcripts,
      });
    }
    setIsLoading(false);
  }, [sessionId]);

  const handleComplete = (data: StatusResponse["result"]) => {
    setResult(data);
    
    // Update local history with final data
    if (data) {
      updateLocalHistory(sessionId, {
        topicName: data.topicName || "Untitled",
        status: "complete",
        notionPageUrl: data.notionPageUrl,
      });
      
      // Save full results to localStorage for offline access
      saveSessionResult({
        sessionId,
        topicName: data.topicName,
        notionPageUrl: data.notionPageUrl,
        summary: data.summary,
        urls: data.urls,
        transcripts: data.transcripts,
        savedAt: new Date().toISOString(),
      });
    }
  };

  const handleError = (errorMessage: string) => {
    // If we already have cached results, don't show error
    if (result) return;
    
    setError(errorMessage);
    
    // Mark as failed in local history (don't delete - preserves user history across deploys)
    updateLocalHistory(sessionId, {
      status: "failed",
    });
  };

  return (
    <div className="min-h-screen pt-safe pb-safe">
      <div className="container mx-auto px-6 pt-2 sm:pt-12 pb-8 max-w-2xl">
        {/* Header */}
        <header className="mb-6 space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {result?.topicName && (
            <h1 className="text-2xl font-semibold tracking-tight">{result.topicName}</h1>
          )}
        </header>

        {/* Content */}
        {error && !result ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => router.push("/")}
              className="text-sm text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        ) : result ? (
          <ResultsView
            sessionId={sessionId}
            notionPageUrl={result.notionPageUrl}
            summary={result.summary}
            urls={result.urls}
            transcripts={result.transcripts}
          />
        ) : !isLoading ? (
          <ProcessingStatus
            sessionId={sessionId}
            onComplete={handleComplete}
            onError={handleError}
          />
        ) : null}
      </div>
    </div>
  );
}
