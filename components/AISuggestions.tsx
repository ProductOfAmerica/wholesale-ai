'use client';

import { AISuggestion } from '../types/transcription';

interface AISuggestionsProps {
  suggestion: AISuggestion | null;
  loading?: boolean;
}

export function AISuggestions({ suggestion, loading = false }: AISuggestionsProps) {
  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>AI Suggestions</h2>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          padding: '1rem', 
          height: '300px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#666'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Analyzing conversation...</span>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>AI Suggestions</h2>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        padding: '1rem', 
        height: '300px',
        backgroundColor: '#f9f9f9',
        overflow: 'auto'
      }}>
        {!suggestion ? (
          <div style={{ 
            color: '#666', 
            textAlign: 'center', 
            padding: '2rem 0',
            fontStyle: 'italic'
          }}>
            No AI suggestions yet. Start simulating speech to get insights.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Motivation Level */}
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Motivation Level
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: suggestion.motivation_level >= 7 ? '#059669' : 
                         suggestion.motivation_level >= 4 ? '#d97706' : '#dc2626'
                }}>
                  {suggestion.motivation_level}
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>/10</span>
              </div>
            </div>

            {/* Objection Alert */}
            {suggestion.objection_detected && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '0.25rem'
                }}>
                  ⚠ Objection Detected
                </div>
                <div style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                  Type: {suggestion.objection_type || 'General'}
                </div>
              </div>
            )}

            {/* Pain Points */}
            {suggestion.pain_points.length > 0 && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Pain Points
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {suggestion.pain_points.map((point, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Response */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '0.5rem'
              }}>
                💬 Suggested Response
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#0c4a6e',
                lineHeight: '1.4'
              }}>
                "{suggestion.suggested_response}"
              </div>
            </div>

            {/* Recommended Next Move */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#14532d',
                marginBottom: '0.5rem'
              }}>
                🎯 Next Move
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#14532d',
                lineHeight: '1.4'
              }}>
                {suggestion.recommended_next_move}
              </div>
            </div>

            {/* Error Display */}
            {suggestion.error && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#7f1d1d'
                }}>
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