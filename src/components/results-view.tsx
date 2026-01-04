"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import type { SummaryResult, TranscriptResult } from "@/types";
import { Chat } from "@/components/chat";
import { motion } from "framer-motion";

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

  const successfulTranscripts = transcripts.filter(t => t.success);

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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0 }}
          className="flex items-center gap-3 flex-wrap"
        >
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => handleCopy(url, `url-${i}`)}
              className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary rounded-full transition-colors flex items-center gap-2 group"
            >
              {getPlatformFromUrl(url)}
              {copied === `url-${i}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              )}
            </button>
          ))}
          {urls.length > 1 && (
            <button
              onClick={() => handleCopy(urls.join('\n'), 'urls')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-secondary/50"
            >
              {copied === 'urls' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              <span>Copy all</span>
            </button>
          )}
        </motion.div>
      )}

      {/* TLDR */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="space-y-4"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</span>
        <ul className="space-y-3">
          {summary.summary.split('\n').filter(line => line.trim()).map((line, i) => (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed">
              <span className="text-muted-foreground/50 select-none">•</span>
              <span>{line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Transcript */}
      {successfulTranscripts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="space-y-3"
        >
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
            
            <button 
              onClick={() => handleCopy(allTranscripts, 'transcript')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1.5 -my-1.5 rounded-md hover:bg-secondary/50"
            >
              {copied === 'transcript' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              Copy
            </button>
          </div>
          
          {transcriptOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <textarea
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
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3 }}
        className="flex gap-3 pt-4 border-t border-border/50"
      >
        <Button 
          onClick={() => { handleCopy(allTranscripts, 'nlm'); window.open('https://notebooklm.google.com/', '_blank'); }}
          className="flex-1 h-11 rounded-xl"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          NotebookLM
        </Button>
      </motion.div>

      {/* Chat */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.4 }}
        className="pt-4"
      >
        <Chat 
          context={`Summary:\n${summary.summary}\n\nTranscripts:\n${allTranscripts}`}
        />
      </motion.div>
    </div>
  );
}
