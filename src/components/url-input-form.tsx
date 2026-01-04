"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { parseUrls, type UrlInfo } from "@/lib/url-detector";
import { getUserId } from "@/lib/user-id";
import { Loader2, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Platform icons as simple SVG components
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'youtube':
      return <YouTubeIcon className="h-4 w-4 text-red-500" />;
    case 'tiktok':
      return <TikTokIcon className="h-4 w-4" />;
    case 'twitter':
      return <XIcon className="h-4 w-4" />;
    case 'instagram':
      return <InstagramIcon className="h-4 w-4 text-pink-500" />;
    default:
      return null;
  }
}

function truncateUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    const truncatedPath = path.length > 20 ? path.slice(0, 20) + '...' : path;
    return urlObj.hostname.replace('www.', '') + truncatedPath;
  } catch {
    return url.slice(0, 35) + (url.length > 35 ? '...' : '');
  }
}

export function UrlInputForm() {
  const [urlList, setUrlList] = useState<UrlInfo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Parse URLs from input
    const parsed = parseUrls(value);
    const validNew = parsed.filter((u) => u.platform !== "unknown");
    
    if (validNew.length > 0) {
      // Add new valid URLs that aren't already in the list
      const existingUrls = new Set(urlList.map(u => u.url));
      const newUrls = validNew.filter(u => !existingUrls.has(u.url));
      const duplicateCount = validNew.length - newUrls.length;
      
      if (newUrls.length > 0) {
        setUrlList(prev => [...prev, ...newUrls]);
      }
      
      // Show feedback for duplicates
      if (duplicateCount > 0 && newUrls.length === 0) {
        toast({
          title: "Already added",
          description: duplicateCount === 1 ? "This URL is already in your list" : `${duplicateCount} URLs already in your list`,
        });
      }
      
      // Clear input after processing
      setInputValue("");
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setUrlList(prev => prev.filter(u => u.url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (urlList.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Paste links from YouTube, X, TikTok, or Instagram",
        variant: "destructive",
      });
      return;
    }

    if (urlList.length > 10) {
      toast({
        title: "Too many URLs",
        description: "Maximum 10 URLs at a time",
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
          urls: urlList.map((u) => u.url),
          userId,
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
      <div className="bg-secondary/30 border border-border/50 rounded-2xl overflow-hidden">
        {/* URL Badges */}
        <AnimatePresence>
          {urlList.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 flex flex-wrap gap-2 border-b border-border/30">
                <AnimatePresence mode="popLayout">
                  {urlList.map((urlInfo) => (
                    <motion.div
                      key={urlInfo.url}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 bg-secondary/60 hover:bg-secondary/80 rounded-lg px-3 py-2 text-sm transition-colors group"
                    >
                      {getPlatformIcon(urlInfo.platform)}
                      <span className="text-muted-foreground">
                        {truncateUrl(urlInfo.url)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUrl(urlInfo.url)}
                        className="ml-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Input Area */}
        <textarea
          ref={textareaRef}
          placeholder={urlList.length > 0 ? "Paste more URLs..." : "Paste video URLs here..."}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            // Cmd+A to select all
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
              e.preventDefault();
              e.currentTarget.select();
            }
            // Backspace/Delete when input is empty removes last URL
            if ((e.key === 'Backspace' || e.key === 'Delete') && inputValue === '' && urlList.length > 0) {
              e.preventDefault();
              setUrlList(prev => prev.slice(0, -1));
            }
          }}
          className={`w-full bg-transparent px-5 py-4 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 ${
            urlList.length > 0 ? 'min-h-[60px]' : 'min-h-[120px]'
          }`}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || urlList.length === 0}
        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-colors hover:bg-primary/80"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Distill {urlList.length > 0 && `(${urlList.length})`}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
