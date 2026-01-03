"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProcessingStatus } from "@/components/processing-status";
import { ResultsView } from "@/components/results-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-xl font-bold">Study Results</h1>
        </div>
      </header>

      {/* Content */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Go Back</Button>
        </div>
      ) : result ? (
        <ResultsView
          sessionId={sessionId}
          notionPageUrl={result.notionPageUrl}
          summary={result.summary}
        />
      ) : (
        <ProcessingStatus
          sessionId={sessionId}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}
    </div>
  );
}
