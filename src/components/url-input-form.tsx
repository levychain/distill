"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { parseUrls } from "@/lib/url-detector";
import { Loader2, ArrowRight } from "lucide-react";

export function UrlInputForm() {
  const [urls, setUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const parsedUrls = urls ? parseUrls(urls) : [];
  const validUrls = parsedUrls.filter((u) => u.platform !== "unknown");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validUrls.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Paste links from YouTube, X, TikTok, or Instagram",
        variant: "destructive",
      });
      return;
    }

    if (validUrls.length > 5) {
      toast({
        title: "Too many URLs",
        description: "Maximum 5 URLs at a time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: validUrls.map((u) => u.url),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start processing");
      }

      const data = await response.json();
      router.push(`/results/${data.sessionId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          placeholder="Paste video URLs here..."
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="w-full min-h-[140px] bg-secondary/30 border border-border/50 rounded-2xl px-5 py-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
          disabled={isLoading}
        />
      </div>

      {validUrls.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{validUrls.length} video{validUrls.length !== 1 ? 's' : ''} detected</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-muted-foreground/60">
            {[...new Set(validUrls.map(u => u.platform))].join(', ')}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || validUrls.length === 0}
        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Distill
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
