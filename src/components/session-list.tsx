"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalHistory, clearLocalHistory, type LocalSession } from "@/lib/local-history";

export function SessionList() {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const history = getLocalHistory();
    setSessions(history);
    setIsLoading(false);
  }, []);

  const handleClearHistory = () => {
    clearLocalHistory();
    setSessions([]);
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

  if (isLoading || sessions.length === 0) {
    return null;
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
                className="flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {session.topicName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {session.urlCount} source{session.urlCount !== 1 ? "s" : ""} • {formatDate(session.createdAt)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
