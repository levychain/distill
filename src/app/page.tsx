"use client";

import { useState, useCallback } from "react";
import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleSessionCreated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen pt-safe pb-safe">
      <div className="container mx-auto px-6 pt-2 sm:pt-12 pb-8 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Distill</h1>
          <p className="text-muted-foreground">
            Turn videos into insights
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-10">
          <UrlInputForm onSessionCreated={handleSessionCreated} />
          <SessionList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
