export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface AISuggestion {
  motivation_level: number;
  pain_points: string[];
  objection_detected: boolean;
  objection_type?: string | null;
  suggested_response: string;
  recommended_next_move: string;
  error?: string;
}

export interface DeepgramTranscriptResult {
  channel: {
    alternatives: Array<{
      transcript: string;
    }>;
  };
  is_final: boolean;
}

export interface TranscriptionConfig {
  model: string;
  smart_format: boolean;
  language: string;
  punctuate: boolean;
}

export type ConversationHistory = TranscriptEntry[];

export interface AnalysisResult {
  motivation_level: number;
  pain_points: string[];
  objection_detected: boolean;
  objection_type?: string | null;
  suggested_response: string;
  recommended_next_move: string;
  error?: string;
}
