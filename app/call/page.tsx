'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveTranscript } from '../../components/LiveTranscript';
import { AISuggestions } from '../../components/AISuggestions';
import { MotivationGauge } from '../../components/MotivationGauge';
import { TranscriptEntry, AISuggestion } from '../../types/transcription';

export default function CallPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [simulationText, setSimulationText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<'seller' | 'user'>('seller');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('connection_ready', () => {
      console.log('Call connection ready');
    });

    socketInstance.on('transcript_update', (data: TranscriptEntry) => {
      console.log('Transcript update:', data);
      setTranscript(prev => [...prev, data]);
      
      // Show loading when seller speaks
      if (data.speaker === 'seller') {
        setAiLoading(true);
      }
    });

    socketInstance.on('ai_suggestion', (data: AISuggestion) => {
      console.log('AI suggestion:', data);
      setCurrentSuggestion(data);
      setAiLoading(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleStartCall = () => {
    if (socket) {
      socket.emit('start_call');
    }
  };

  const handleSimulateSpeech = () => {
    if (socket && simulationText.trim()) {
      socket.emit('simulate_speech', {
        speaker: selectedSpeaker,
        text: simulationText
      });
      setSimulationText('');
    }
  };

  const handleRunDemo = () => {
    if (socket) {
      setTranscript([]);
      setCurrentSuggestion(null);
      setAiLoading(false);
      socket.emit('run_demo');
    }
  };

  return (
    <main style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
        AI Negotiation Copilot
      </h1>
      
      {/* Status and Controls */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <div style={{ fontSize: '1rem', fontWeight: '500' }}>
            Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleStartCall}
              disabled={!connected}
              style={{ 
                background: connected ? '#0070f3' : '#ccc', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '6px',
                cursor: connected ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              Start Call
            </button>
            
            <button 
              onClick={handleRunDemo}
              disabled={!connected}
              style={{ 
                background: connected ? '#059669' : '#ccc', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '6px',
                cursor: connected ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              Run Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left Column: Live Transcript */}
        <LiveTranscript transcript={transcript} />

        {/* Right Column: AI Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Motivation Gauge */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffffff', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <MotivationGauge 
              level={currentSuggestion?.motivation_level || 0} 
              animated={true}
            />
          </div>

          {/* AI Suggestions */}
          <AISuggestions 
            suggestion={currentSuggestion} 
            loading={aiLoading}
          />
        </div>
      </div>

      {/* Text Simulation Controls */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
          Text Simulation (for testing)
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <select 
            value={selectedSpeaker} 
            onChange={(e) => setSelectedSpeaker(e.target.value as 'seller' | 'user')}
            style={{ 
              marginRight: '1rem', 
              padding: '0.5rem', 
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white'
            }}
          >
            <option value="seller">Seller</option>
            <option value="user">You (Wholesaler)</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={simulationText}
            onChange={(e) => setSimulationText(e.target.value)}
            placeholder="Enter speech to simulate..."
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSimulateSpeech()}
          />
          <button 
            onClick={handleSimulateSpeech}
            disabled={!connected || !simulationText.trim()}
            style={{ 
              background: connected && simulationText.trim() ? '#0070f3' : '#ccc', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '6px',
              cursor: connected && simulationText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}