'use client';

import type {
  CallSessionAAR,
  CopilotSuggestion,
  FinancialRouting,
  TCPMAnalysis,
} from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

export interface UseCopilotSessionReturn {
  tcpmAnalysis: TCPMAnalysis | null;
  suggestions: CopilotSuggestion[];
  financialRouting: FinancialRouting | null;
  aar: CallSessionAAR | null;
  handleQuestionClick: (question: string) => void;
  reset: () => void;
}

export function useCopilotSession(
  socket: Socket | null
): UseCopilotSessionReturn {
  const [tcpmAnalysis, setTcpmAnalysis] = useState<TCPMAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [financialRouting, setFinancialRouting] =
    useState<FinancialRouting | null>(null);
  const [aar, setAar] = useState<CallSessionAAR | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('tcpm_update', (data: TCPMAnalysis) => {
      setTcpmAnalysis(data);
    });

    socket.on('copilot_suggestion', (data: CopilotSuggestion) => {
      setSuggestions((prev) => [...prev, data]);
    });

    socket.on('financial_routing', (data: FinancialRouting) => {
      setFinancialRouting(data);
    });

    socket.on('aar_generated', (data: CallSessionAAR) => {
      setAar(data);
    });

    return () => {
      socket.off('tcpm_update');
      socket.off('copilot_suggestion');
      socket.off('financial_routing');
      socket.off('aar_generated');
    };
  }, [socket]);

  const handleQuestionClick = useCallback(
    (question: string) => {
      if (!socket) return;
      socket.emit('add_script_prompt', { question });
    },
    [socket]
  );

  const reset = useCallback(() => {
    setTcpmAnalysis(null);
    setSuggestions([]);
    setFinancialRouting(null);
    setAar(null);
  }, []);

  return {
    tcpmAnalysis,
    suggestions,
    financialRouting,
    aar,
    handleQuestionClick,
    reset,
  };
}
