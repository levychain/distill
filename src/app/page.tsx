import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UrlInputForm } from "@/components/url-input-form";
import { SessionList } from "@/components/session-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, BookOpen } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Content Study Tool</h1>
            <p className="text-sm text-muted-foreground">
              Extract, summarize, and study content from anywhere
            </p>
          </div>
        </div>
        <Link href="/api/auth/signout">
          <Button variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        <UrlInputForm />
        <SessionList />
      </div>
    </div>
  );
}
