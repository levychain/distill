"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProcessingStatus } from "@/components/processing-status";
import { ResultsView } from "@/components/results-view";
import { ArrowLeft } from "lucide-react";
import type { StatusResponse } from "@/types";

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [result, setResult] = useState<StatusResponse["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleComplete = (data: StatusResponse["result"]) => {
    setResult(data);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <header className="mb-8 space-y-4">
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
        {error ? (
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
        ) : (
          <ProcessingStatus
            sessionId={sessionId}
            onComplete={handleComplete}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
