import type { StudySession } from "@/types";

// In-memory session store (for simplicity)
// In production, you might want to use Redis or a database
// Note: Session history is now stored locally on the client (localStorage)
// This store just holds processing state during the session

// Extend the global namespace for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __sessionStore: Map<string, StudySession> | undefined;
}

// Use global to persist across Next.js HMR reloads in dev mode
// This pattern is recommended by Prisma for Next.js
const sessions = global.__sessionStore ?? new Map<string, StudySession>();

if (process.env.NODE_ENV !== "production") {
  global.__sessionStore = sessions;
}

export function createSession(
  id: string,
  topicName: string,
  urls: string[],
  notionPageId: string,
  notionPageUrl: string
): StudySession {
  const session: StudySession = {
    id,
    topicName,
    urls,
    status: "pending",
    notionPageId,
    notionPageUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: {
      current: 0,
      total: urls.length,
      stage: "Initializing",
    },
  };

  sessions.set(id, session);
  return session;
}

export function getSession(id: string): StudySession | undefined {
  return sessions.get(id);
}

export function updateSession(
  id: string,
  updates: Partial<StudySession>
): StudySession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;

  const updated: StudySession = {
    ...session,
    ...updates,
    updatedAt: new Date(),
  };

  sessions.set(id, updated);
  return updated;
}

export function getAllSessions(): StudySession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
