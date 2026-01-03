"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, BookOpen, Lightbulb, Target, HelpCircle, Link2 } from "lucide-react";
import type { SummaryResult } from "@/types";

interface ResultsViewProps {
  sessionId: string;
  notionPageUrl: string;
  summary: SummaryResult;
}

export function ResultsView({ sessionId, notionPageUrl, summary }: ResultsViewProps) {
  const handleDownload = () => {
    window.open(`/api/export/${sessionId}`, "_blank");
  };

  const handleOpenNotion = () => {
    window.open(notionPageUrl, "_blank");
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleOpenNotion} className="flex-1 sm:flex-none">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in Notion
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          Download for NotebookLM
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{summary.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{summary.keyTakeaways}</div>
          </div>
        </CardContent>
      </Card>

      {/* How to Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            How to Apply This
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{summary.howToApply}</div>
          </div>
        </CardContent>
      </Card>

      {/* Study Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            Study Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{summary.studyQuestions}</div>
          </div>
        </CardContent>
      </Card>

      {/* Connections and Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-purple-500" />
            Connections and Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{summary.connectionsAndPatterns}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
