/**
 * Local history management using localStorage
 * Stores session metadata only (not transcripts/full content)
 */

const HISTORY_KEY = "distill_history";
const MAX_HISTORY_ITEMS = 50;

export interface LocalSession {
  id: string;
  topicName: string;
  urlCount: number;
  status: "pending" | "processing" | "complete" | "failed";
  createdAt: string;
  notionPageUrl?: string;
}

/**
 * Get all sessions from local history
 */
export function getLocalHistory(): LocalSession[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LocalSession[];
  } catch {
    return [];
  }
}

/**
 * Save a new session to local history
 */
export function saveToLocalHistory(session: LocalSession): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getLocalHistory();
    
    // Check if session already exists
    const existingIndex = history.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      // Update existing
      history[existingIndex] = session;
    } else {
      // Add new at the beginning
      history.unshift(session);
    }
    
    // Cap at max items
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save to local history:", error);
  }
}

/**
 * Update an existing session in local history
 */
export function updateLocalHistory(
  sessionId: string,
  updates: Partial<LocalSession>
): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getLocalHistory();
    const index = history.findIndex(s => s.id === sessionId);
    
    if (index >= 0) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("Failed to update local history:", error);
  }
}

/**
 * Remove a session from local history
 */
export function removeFromLocalHistory(sessionId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getLocalHistory();
    const filtered = history.filter(s => s.id !== sessionId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from local history:", error);
  }
}

/**
 * Clear all local history
 */
export function clearLocalHistory(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear local history:", error);
  }
}

