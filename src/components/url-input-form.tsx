"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { parseUrls, getPlatformDisplayName } from "@/lib/url-detector";
import { Loader2, Youtube, Twitter, Instagram, Video } from "lucide-react";

export function UrlInputForm() {
  const [urls, setUrls] = useState("");
  const [topicName, setTopicName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const parsedUrls = urls ? parseUrls(urls) : [];
  const validUrls = parsedUrls.filter((u) => u.platform !== "unknown");
  const invalidUrls = parsedUrls.filter((u) => u.platform === "unknown");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validUrls.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Please enter at least one valid URL from YouTube, X, TikTok, or Instagram.",
        variant: "destructive",
      });
      return;
    }

    if (validUrls.length > 5) {
      toast({
        title: "Too many URLs",
        description: "Please enter a maximum of 5 URLs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: validUrls.map((u) => u.url),
          topicName: topicName || undefined,
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
        description: error instanceof Error ? error.message : "Failed to start processing",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "tiktok":
        return <Video className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Study Content</CardTitle>
        <CardDescription>
          Paste URLs from YouTube, X (Twitter), TikTok, or Instagram to create a study guide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="urls">URLs (one per line, max 5)</Label>
            <Textarea
              id="urls"
              placeholder="https://www.youtube.com/watch?v=...
https://x.com/user/status/...
https://www.tiktok.com/@user/video/..."
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
              disabled={isLoading}
            />
            {parsedUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {validUrls.map((url, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    {getPlatformIcon(url.platform)}
                    {getPlatformDisplayName(url.platform)}
                  </Badge>
                ))}
                {invalidUrls.map((url, i) => (
                  <Badge key={`invalid-${i}`} variant="destructive">
                    Unknown URL
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic Name (optional)</Label>
            <Input
              id="topic"
              placeholder="e.g., Wholesale Real Estate"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              If left blank, a topic will be generated from the content.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={isLoading || validUrls.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Process ${validUrls.length} URL${validUrls.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
