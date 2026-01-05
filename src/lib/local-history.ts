/**
 * Local history management using localStorage
 * Stores session metadata and full results for offline access
 */

import type { SummaryResult, TranscriptResult } from "@/types";

const HISTORY_KEY = "distill_history";
const RESULTS_KEY = "distill_results";
const MAX_HISTORY_ITEMS = 50;
const MAX_RESULTS_ITEMS = 20; // Store fewer full results due to size

export interface LocalSession {
  id: string;
  topicName: string;
  urlCount: number;
  status: "pending" | "processing" | "complete" | "failed";
  createdAt: string;
  notionPageUrl?: string;
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
}

export interface LocalResult {
  sessionId: string;
  topicName: string;
  notionPageUrl: string;
  summary: SummaryResult;
  urls: string[];
  transcripts: TranscriptResult[];
  savedAt: string;
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
    localStorage.removeItem(RESULTS_KEY);
  } catch (error) {
    console.error("Failed to clear local history:", error);
  }
}

/**
 * Save full session results to localStorage
 */
export function saveSessionResult(result: LocalResult): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    const results: LocalResult[] = stored ? JSON.parse(stored) : [];
    
    // Check if result already exists
    const existingIndex = results.findIndex(r => r.sessionId === result.sessionId);
    
    if (existingIndex >= 0) {
      results[existingIndex] = result;
    } else {
      results.unshift(result);
    }
    
    // Cap at max items
    const trimmed = results.slice(0, MAX_RESULTS_ITEMS);
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save session result:", error);
  }
}

/**
 * Get session result from localStorage
 */
export function getSessionResult(sessionId: string): LocalResult | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (!stored) return null;
    
    const results: LocalResult[] = JSON.parse(stored);
    return results.find(r => r.sessionId === sessionId) || null;
  } catch {
    return null;
  }
}

