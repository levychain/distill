import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Distill</h1>
            <p className="text-sm text-muted-foreground">
              Extract, summarize, and study content from anywhere
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        <UrlInputForm />
        <SessionList />
      </div>
    </div>
  );
}
