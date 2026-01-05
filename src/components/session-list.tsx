"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalHistory, clearLocalHistory, updateLocalHistory, type LocalSession } from "@/lib/local-history";
import { useToast } from "@/components/ui/use-toast";

function StatusBadge({ status, progress }: { status: LocalSession["status"]; progress?: LocalSession["progress"] }) {
  switch (status) {
    case "processing":
    case "pending":
      // Cap at total to avoid showing "6/5" during summary generation
      const displayCount = progress ? Math.min(progress.current + 1, progress.total) : 0;
      return (
        <span className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
          <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
          {progress ? `${displayCount}/${progress.total}` : "Processing"}
        </span>
      );
    case "complete":
      return (
        <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

export function SessionList({ refreshTrigger }: { refreshTrigger?: number } = {}) {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCleared, setHasCleared] = useState(false);
  const { toast } = useToast();
  
  // Track which sessions we've already shown completion toasts for
  const completedToastsShown = useRef<Set<string>>(new Set());

  // Load sessions from localStorage
  const loadSessions = useCallback(() => {
    const history = getLocalHistory();
    setSessions(history);
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Refresh when trigger changes (new session created)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadSessions();
    }
  }, [refreshTrigger, loadSessions]);

  // Poll for status updates on processing sessions
  useEffect(() => {
    const processingSessions = sessions.filter(
      s => s.status === "processing" || s.status === "pending"
    );
    
    if (processingSessions.length === 0) return;

    const pollStatus = async () => {
      for (const session of processingSessions) {
        try {
          const response = await fetch(`/api/status/${session.id}`);
          
          if (response.status === 404) {
            // Session not found on server (likely server restarted)
            // Mark as failed instead of deleting - preserves user history
            updateLocalHistory(session.id, { status: "failed" });
            continue;
          }
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          // Update local history with new status/progress
          const updates: Partial<LocalSession> = {
            status: data.status,
            progress: data.progress,
          };
          
          // Update topic name if we have results
          if (data.result?.topicName && data.result.topicName !== "Processing...") {
            updates.topicName = data.result.topicName;
          }
          
          updateLocalHistory(session.id, updates);
          
          // Check if just completed and show toast
          if (data.status === "complete" && !completedToastsShown.current.has(session.id)) {
            completedToastsShown.current.add(session.id);
            
            const topicName = data.result?.topicName || session.topicName;
            toast({
              title: "Distill ready",
              description: topicName !== "Processing..." ? topicName : "Your content is ready to view",
            });
          }
          
          // Check if failed
          if (data.status === "failed" && !completedToastsShown.current.has(session.id)) {
            completedToastsShown.current.add(session.id);
            toast({
              title: "Processing failed",
              description: data.error || "Something went wrong",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error polling session ${session.id}:`, error);
        }
      }
      
      // Reload to reflect updates
      loadSessions();
    };

    // Poll immediately, then every 3 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    
    return () => clearInterval(interval);
  }, [sessions, loadSessions, toast]);

  const handleClearHistory = () => {
    clearLocalHistory();
    setSessions([]);
    setHasCleared(true);
    completedToastsShown.current.clear();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get progress text for processing sessions
  const getProgressText = (session: LocalSession) => {
    if (session.progress?.stage) {
      // Simplify the stage text (e.g., "Transcribing tiktok (1/3)" -> "Transcribing · 1/3")
      const stage = session.progress.stage;
      if (stage.includes("Transcribing")) {
        const platform = stage.match(/Transcribing (\w+)/)?.[1];
        return `Transcribing ${platform || ""} · ${session.progress.current + 1}/${session.progress.total}`;
      }
      if (stage.includes("Claude")) {
        return "Generating summary...";
      }
      return stage;
    }
    return `${session.urlCount} source${session.urlCount !== 1 ? "s" : ""}`;
  };

  // Show nothing while loading initially
  if (isLoading) {
    return null;
  }

  // Show empty state after clearing or if no sessions
  if (sessions.length === 0) {
    if (!hasCleared) return null; // Don't show empty state on first load with no history
    
    return (
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            (this device)
          </span>
        </div>
        <p className="text-sm text-muted-foreground/50 py-4 text-center">
          No recent sessions
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            (this device)
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {sessions.slice(0, 5).map((session, index) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Link
                href={`/results/${session.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-secondary/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate pr-2">
                    {session.topicName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(session.status === "processing" || session.status === "pending")
                      ? getProgressText(session)
                      : `${session.urlCount} source${session.urlCount !== 1 ? "s" : ""} • ${formatDate(session.createdAt)}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={session.status} progress={session.progress} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
