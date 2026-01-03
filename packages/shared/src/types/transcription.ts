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

export interface CallSummary {
  duration: number;
  final_motivation_level: number;
  pain_points: string[];
  objections: string[];
  summary: string;
  next_steps: string;
  error?: string;
}
