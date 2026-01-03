export type Platform = "youtube" | "twitter" | "tiktok" | "instagram" | "unknown";

export type ProcessingStatus = "pending" | "processing" | "complete" | "failed";

export interface UrlInfo {
  url: string;
  platform: Platform;
  id?: string;
}

export interface TranscriptResult {
  url: string;
  platform: Platform;
  transcript: string;
  error?: string;
  success: boolean;
}

export interface SummaryResult {
  summary: string;
  keyTakeaways: string;
  howToApply: string;
  studyQuestions?: string; // Deprecated - no longer generated
  connectionsAndPatterns: string;
}

export interface StudySession {
  id: string;
  userId: string;
  topicName: string;
  urls: string[];
  status: ProcessingStatus;
  notionPageId?: string;
  notionPageUrl?: string;
  transcripts?: TranscriptResult[];
  summary?: SummaryResult;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
}

export interface ProcessRequest {
  urls: string[];
  topicName?: string;
  userId: string;
}

export interface ProcessResponse {
  sessionId: string;
  notionPageId: string;
  notionPageUrl: string;
}

export interface StatusResponse {
  status: ProcessingStatus;
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
  error?: string;
  result?: {
    topicName: string;
    notionPageUrl: string;
    summary: SummaryResult;
    urls: string[];
    transcripts: TranscriptResult[];
  };
}
