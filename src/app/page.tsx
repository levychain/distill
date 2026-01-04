import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";

export default function HomePage() {
  return (
    <div className="min-h-screen pt-safe pb-safe">
      <div className="container mx-auto px-6 py-12 max-w-2xl">
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
