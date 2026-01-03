"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Session {
  id: string;
  topicName: string;
  status: string;
  urlCount: number;
  notionPageUrl?: string;
  createdAt: string;
}

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

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
    <div className="space-y-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Recent
      </span>
      <div className="space-y-1">
        {sessions.slice(0, 5).map((session) => (
          <Link
            key={session.id}
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
        ))}
      </div>
    </div>
  );
}
