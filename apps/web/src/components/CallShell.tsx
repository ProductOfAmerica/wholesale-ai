'use client';

import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { Suspense, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { AISuggestions } from '@/components/AISuggestions';
import { LiveTranscript } from '@/components/LiveTranscript';
import { MotivationGauge } from '@/components/MotivationGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CallShell() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSuggestion, setCurrentSuggestion] =
    useState<AISuggestion | null>(null);
  const [simulationText, setSimulationText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<'seller' | 'user'>(
    'seller'
  );
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Connect to Socket.io server using environment variable
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socketInstance = io(socketUrl);
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
    <>
      {/* Status and Controls */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">Status:</span>
              <Badge variant={connected ? 'default' : 'destructive'}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStartCall}
                disabled={!connected}
                variant="default"
              >
                Start Call
              </Button>

              <Button
                onClick={handleRunDemo}
                disabled={!connected}
                variant="secondary"
              >
                Run Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Loading transcript...
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading motivation gauge...
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Loading AI suggestions...
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Live Transcript */}
          <div className="lg:col-span-2">
            <LiveTranscript transcript={transcript} />
          </div>

          {/* Right Column: AI Analysis */}
          <div className="space-y-6">
            {/* Motivation Gauge */}
            <Card>
              <CardContent className="pt-6">
                <MotivationGauge
                  level={currentSuggestion?.motivation_level || 0}
                  animated={true}
                />
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <AISuggestions suggestion={currentSuggestion} loading={aiLoading} />
          </div>
        </div>
      </Suspense>

      {/* Text Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Text Simulation (for testing)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select
              value={selectedSpeaker}
              onValueChange={(value) =>
                setSelectedSpeaker(value as 'seller' | 'user')
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="user">You (Wholesaler)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Input
              type="text"
              value={simulationText}
              onChange={(e) => setSimulationText(e.target.value)}
              placeholder="Enter speech to simulate..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSimulateSpeech()}
            />
            <Button
              onClick={handleSimulateSpeech}
              disabled={!connected || !simulationText.trim()}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
