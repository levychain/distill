import { AssemblyAI } from "assemblyai";
import { readFile } from "fs/promises";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    // Read the file and upload it to AssemblyAI
    const audioData = await readFile(audioPath);

    // Upload the file
    const uploadUrl = await client.files.upload(audioData);

    // Transcribe the uploaded file
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      language_detection: true,
    });

    if (transcript.status === "error") {
      throw new Error(transcript.error || "Transcription failed");
    }

    return transcript.text || "";
  } catch (error) {
    console.error("AssemblyAI transcription error:", error);
    throw error;
  }
}

export async function transcribeFromUrl(audioUrl: string): Promise<string> {
  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: audioUrl,
      language_detection: true,
    });

    if (transcript.status === "error") {
      throw new Error(transcript.error || "Transcription failed");
    }

    return transcript.text || "";
  } catch (error) {
    console.error("AssemblyAI transcription error:", error);
    throw error;
  }
}

export async function getTranscriptStatus(
  transcriptId: string
): Promise<{
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
}> {
  try {
    const transcript = await client.transcripts.get(transcriptId);

    return {
      status: transcript.status as "queued" | "processing" | "completed" | "error",
      text: transcript.text || undefined,
      error: transcript.error || undefined,
    };
  } catch (error) {
    console.error("Error getting transcript status:", error);
    throw error;
  }
}
