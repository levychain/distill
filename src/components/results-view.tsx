"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, BookOpen, TextSelect } from "lucide-react";
import type { SummaryResult, TranscriptResult } from "@/types";
import { Chat } from "@/components/chat";

interface ResultsViewProps {
  sessionId: string;
  notionPageUrl: string;
  summary: SummaryResult;
  urls?: string[];
  transcripts?: TranscriptResult[];
}

function getPlatformFromUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "X";
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  return "Link";
}

export function ResultsView({ sessionId, notionPageUrl, summary, urls = [], transcripts = [] }: ResultsViewProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const successfulTranscripts = transcripts.filter(t => t.success);

  const handleSelectAll = () => {
    const el = transcriptRef.current as unknown as HTMLTextAreaElement;
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const allTranscripts = successfulTranscripts.map(t => t.transcript).join('\n\n---\n\n');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      
      {/* Sources */}
      {urls.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => handleCopy(url, `url-${i}`)}
              className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary rounded-full transition-colors flex items-center gap-2"
            >
              {getPlatformFromUrl(url)}
              {copied === `url-${i}` && <Check className="h-3 w-3 text-green-500" />}
            </button>
          ))}
          {urls.length > 1 && (
            <button
              onClick={() => handleCopy(urls.join('\n'), 'urls')}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {copied === 'urls' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              <span>Copy all</span>
            </button>
          )}
        </div>
      )}

      {/* TLDR */}
      <div className="space-y-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</span>
        <ul className="space-y-3">
          {summary.summary.split('\n').filter(line => line.trim()).map((line, i) => (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed">
              <span className="text-muted-foreground/50 select-none">•</span>
              <span>{line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transcript */}
      {successfulTranscripts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTranscriptOpen(!transcriptOpen)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {transcriptOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Transcript
            </button>
            
            {transcriptOpen && (
              <>
                <button 
                  onClick={handleSelectAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <TextSelect className="h-3.5 w-3.5" />
                  Select
                </button>
                <button 
                  onClick={() => handleCopy(allTranscripts, 'transcript')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {copied === 'transcript' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
              </>
            )}
          </div>
          
          {transcriptOpen && (
            <textarea
              ref={transcriptRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={allTranscripts}
              onChange={() => {}}
              onKeyDown={(e) => {
                // Manually handle Cmd+A
                if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                  e.preventDefault();
                  e.currentTarget.select();
                  return;
                }
                // Allow Cmd+C
                if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                  return;
                }
                // Block all other input
                e.preventDefault();
              }}
              spellCheck={false}
              className="w-full h-48 p-4 text-sm text-muted-foreground bg-secondary/30 rounded-xl resize-none leading-relaxed border-none cursor-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border/50">
        <Button 
          onClick={() => { handleCopy(allTranscripts, 'nlm'); window.open('https://notebooklm.google.com/', '_blank'); }}
          className="flex-1 h-11 rounded-xl"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          NotebookLM
        </Button>
      </div>

      {/* Chat */}
      <div className="pt-4">
        <Chat 
          context={`Summary:\n${summary.summary}\n\nTranscripts:\n${allTranscripts}`}
        />
      </div>
    </div>
  );
}
