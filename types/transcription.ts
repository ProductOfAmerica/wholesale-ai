export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface AISuggestion {
  motivation_level: number;
  pain_points: string[];
  objection_detected: boolean;
  objection_type?: string;
  suggested_response: string;
  recommended_next_move: string;
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