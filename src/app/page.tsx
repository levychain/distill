"use client";

import { useEffect, useRef } from "react";
import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // #region agent log
  useEffect(() => {
    if (containerRef.current) {
      const styles = getComputedStyle(containerRef.current);
      fetch('http://127.0.0.1:7244/ingest/e7e98a94-ed7b-4ddd-89ab-dcfb07735794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:useEffect',message:'POST-FIX Padding debug',data:{paddingTop:styles.paddingTop,paddingBottom:styles.paddingBottom},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
    }
  }, []);
  // #endregion

  return (
    <div className="min-h-screen pt-safe pb-safe">
      <div ref={containerRef} className="container mx-auto px-6 pt-2 pb-8 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Distill</h1>
          <p className="text-muted-foreground">
            Turn videos into insights
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-10">
          <UrlInputForm />
          <SessionList />
        </div>
      </div>
    </div>
  );
}
