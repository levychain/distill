"use client";

import { useEffect, useRef } from "react";
import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";

export default function HomePage() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // #region agent log
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      const outerStyles = getComputedStyle(outerRef.current);
      const innerStyles = getComputedStyle(innerRef.current);
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--sat') || 'N/A';
      fetch('http://127.0.0.1:7244/ingest/e7e98a94-ed7b-4ddd-89ab-dcfb07735794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:useEffect',message:'Padding debug',data:{outerPaddingTop:outerStyles.paddingTop,innerPaddingTop:innerStyles.paddingTop,safeAreaInsetTop:safeAreaTop,envValue:outerStyles.getPropertyValue('padding-top')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H2'})}).catch(()=>{});
    }
  }, []);
  // #endregion

  return (
    <div ref={outerRef} className="min-h-screen pt-safe pb-safe">
      <div ref={innerRef} className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Distill</h1>
          <p className="text-muted-foreground">
            Turn videos into insights
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-12">
          <UrlInputForm />
          <SessionList />
        </div>
      </div>
    </div>
  );
}
