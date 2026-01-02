'use client';

import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { AISuggestions } from '@/components/AISuggestions';
import { LiveTranscript } from '@/components/LiveTranscript';
import { MotivationGauge } from '@/components/MotivationGauge';

export default function CallPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSuggestion, setCurrentSuggestion] =
    useState<AISuggestion | null>(null);
  const [simulationText, setSimulationText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<'seller' | 'user'>(
    'seller',
  );
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Connect to Socket.io server (will be on different port in monorepo)
    const socketInstance = io('http://localhost:3001');
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
      setTranscript((prev) => [...prev, data]);

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
        text: simulationText,
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
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        AI Negotiation Copilot
      </h1>

      {/* Status and Controls */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-medium">
            Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleStartCall}
              disabled={!connected}
              className="bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:cursor-not-allowed"
            >
              Start Call
            </button>

            <button
              type="button"
              onClick={handleRunDemo}
              disabled={!connected}
              className="bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:cursor-not-allowed"
            >
              Run Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Live Transcript */}
        <div className="lg:col-span-2">
          <LiveTranscript transcript={transcript} />
        </div>

        {/* Right Column: AI Analysis */}
        <div className="space-y-6">
          {/* Motivation Gauge */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <MotivationGauge
              level={currentSuggestion?.motivation_level || 0}
              animated={true}
            />
          </div>

          {/* AI Suggestions */}
          <AISuggestions suggestion={currentSuggestion} loading={aiLoading} />
        </div>
      </div>

      {/* Text Simulation Controls */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Text Simulation (for testing)
        </h3>

        <div className="mb-4">
          <select
            value={selectedSpeaker}
            onChange={(e) =>
              setSelectedSpeaker(e.target.value as 'seller' | 'user')
            }
            className="mr-4 p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="seller">Seller</option>
            <option value="user">You (Wholesaler)</option>
          </select>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={simulationText}
            onChange={(e) => setSimulationText(e.target.value)}
            placeholder="Enter speech to simulate..."
            className="flex-1 p-3 border border-gray-300 rounded-md text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSimulateSpeech()}
          />
          <button
            type="button"
            onClick={handleSimulateSpeech}
            disabled={!connected || !simulationText.trim()}
            className="bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-blue-700 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
