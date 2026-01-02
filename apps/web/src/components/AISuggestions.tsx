'use client';

import type { AISuggestion } from '@wholesale-ai/shared';

interface AISuggestionsProps {
  suggestion: AISuggestion | null;
  loading?: boolean;
}

export function AISuggestions({
  suggestion,
  loading = false,
}: AISuggestionsProps) {
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
        <div className="border border-gray-300 rounded-lg p-4 h-80 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span>Analyzing conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
      <div className="border border-gray-300 rounded-lg p-4 h-80 bg-gray-50 overflow-auto">
        {!suggestion ? (
          <div className="text-gray-600 text-center py-8 italic">
            No AI suggestions yet. Start simulating speech to get insights.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Motivation Level */}
            <div className="p-3 bg-white rounded-md border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Motivation Level
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    suggestion.motivation_level >= 7
                      ? 'text-green-600'
                      : suggestion.motivation_level >= 4
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {suggestion.motivation_level}
                </span>
                <span className="text-gray-500 text-sm">/10</span>
              </div>
            </div>

            {/* Objection Alert */}
            {suggestion.objection_detected && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200">
                <div className="text-sm font-semibold text-red-600 mb-1">
                  ⚠ Objection Detected
                </div>
                <div className="text-sm text-red-800">
                  Type: {suggestion.objection_type || 'General'}
                </div>
              </div>
            )}

            {/* Pain Points */}
            {suggestion.pain_points.length > 0 && (
              <div className="p-3 bg-white rounded-md border border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Pain Points
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.pain_points.map((point) => (
                    <span
                      key={point}
                      className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Response */}
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="text-sm font-semibold text-blue-800 mb-2">
                💬 Suggested Response
              </div>
              <div className="text-sm text-blue-800 leading-relaxed">
                "{suggestion.suggested_response}"
              </div>
            </div>

            {/* Recommended Next Move */}
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <div className="text-sm font-semibold text-green-800 mb-2">
                🎯 Next Move
              </div>
              <div className="text-sm text-green-800 leading-relaxed">
                {suggestion.recommended_next_move}
              </div>
            </div>

            {/* Error Display */}
            {suggestion.error && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200">
                <div className="text-xs text-red-800">
                  ⚠ Analysis error: {suggestion.error}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
