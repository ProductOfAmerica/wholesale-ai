'use client';

import { Call, Device } from '@twilio/voice-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'error';

export interface CallState {
  status: CallStatus;
  callSid: string | null;
  phoneNumber: string | null;
  duration: number;
  error: string | null;
}

const ACTIVE_CALL_KEY = 'wholesale-ai-active-call';

interface StoredCallData {
  callSid: string;
  phoneNumber: string;
  startTime: number;
}

function saveActiveCall(data: StoredCallData): void {
  localStorage.setItem(ACTIVE_CALL_KEY, JSON.stringify(data));
}

function getActiveCall(): StoredCallData | null {
  const stored = localStorage.getItem(ACTIVE_CALL_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearActiveCall(): void {
  localStorage.removeItem(ACTIVE_CALL_KEY);
}

async function cleanupOrphanedCall(callSid: string): Promise<void> {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '');
    await fetch(`${serverUrl}/twilio/end-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSid }),
    });
    console.log(`Cleaned up orphaned call: ${callSid}`);
  } catch (error) {
    console.error('Failed to cleanup orphaned call:', error);
  }
  clearActiveCall();
}

function setupCallEventHandlers(
  call: Call,
  phoneNumber: string,
  socket: Socket | null,
  setCallState: (updater: (prev: CallState) => CallState) => void,
  activeCallRef: { current: Call | null }
): void {
  call.on('ringing', () => {
    console.log('Call is ringing');
    setCallState((prev) => ({ ...prev, status: 'ringing' }));
  });

  call.on('accept', () => {
    console.log('Call connected');
    const callSid = call.parameters.CallSid || null;
    setCallState((prev) => ({ ...prev, status: 'connected', callSid }));
    if (callSid) {
      saveActiveCall({ callSid, phoneNumber, startTime: Date.now() });
      socket?.emit('webrtc_call_started', { callSid, phoneNumber });
    }
  });

  call.on('disconnect', () => {
    console.log('Call disconnected');
    clearActiveCall();
    setCallState((prev) => ({ ...prev, status: 'ended' }));
    activeCallRef.current = null;
  });

  call.on('error', (error) => {
    console.error('Call error:', error);
    clearActiveCall();
    setCallState((prev) => ({
      ...prev,
      status: 'error',
      error: error.message,
    }));
    activeCallRef.current = null;
  });

  call.on('cancel', () => {
    console.log('Call cancelled');
    clearActiveCall();
    setCallState((prev) => ({ ...prev, status: 'ended' }));
    activeCallRef.current = null;
  });
}

export function useTwilioCall(socket: Socket | null) {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    callSid: null,
    phoneNumber: null,
    duration: 0,
    error: null,
  });
  const [deviceReady, setDeviceReady] = useState(false);

  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const orphanedCall = getActiveCall();
    if (!orphanedCall) return;

    const callAge = Date.now() - orphanedCall.startTime;
    const maxCallAge = 4 * 60 * 60 * 1000;
    if (callAge < maxCallAge) {
      console.log(
        `Found orphaned call: ${orphanedCall.callSid}, cleaning up...`
      );
      void cleanupOrphanedCall(orphanedCall.callSid);
    } else {
      clearActiveCall();
    }
  }, []);

  useEffect(() => {
    async function initDevice() {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '');
        if (!serverUrl) {
          throw new Error('NEXT_PUBLIC_SOCKET_URL not configured');
        }

        const response = await fetch(`${serverUrl}/twilio/token`);
        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }

        const { token } = await response.json();

        const device = new Device(token, {
          logLevel: 1,
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        });

        device.on('registered', () => {
          console.log('Twilio Device registered');
          setDeviceReady(true);
        });

        device.on('error', (error) => {
          console.error('Twilio Device error:', error);
          setCallState((prev) => ({
            ...prev,
            status: 'error',
            error: error.message,
          }));
        });

        device.on('unregistered', () => {
          console.log('Twilio Device unregistered');
          setDeviceReady(false);
        });

        await device.register();
        deviceRef.current = device;
      } catch (error) {
        console.error('Failed to initialize Twilio Device:', error);
        setCallState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to initialize phone',
        }));
      }
    }

    void initDevice();

    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (callState.status === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.status]);

  const startCall = useCallback(
    async (phoneNumber: string) => {
      if (!deviceRef.current || !deviceReady) {
        setCallState((prev) => ({
          ...prev,
          error: 'Phone not ready. Please wait...',
        }));
        return;
      }

      setCallState({
        status: 'initiating',
        callSid: null,
        phoneNumber,
        duration: 0,
        error: null,
      });

      try {
        const call = await deviceRef.current.connect({
          params: { To: phoneNumber },
        });
        activeCallRef.current = call;
        setupCallEventHandlers(
          call,
          phoneNumber,
          socket,
          setCallState,
          activeCallRef
        );
      } catch (error) {
        console.error('Failed to start call:', error);
        setCallState((prev) => ({
          ...prev,
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Failed to start call',
        }));
      }
    },
    [deviceReady, socket]
  );

  const endCall = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
      activeCallRef.current = null;
    }
    clearActiveCall();
    setCallState((prev) => ({ ...prev, status: 'ended' }));
  }, []);

  const resetCall = useCallback(() => {
    setCallState({
      status: 'idle',
      callSid: null,
      phoneNumber: null,
      duration: 0,
      error: null,
    });
  }, []);

  const reAssociateCall = useCallback(() => {
    const storedCall = getActiveCall();
    if (storedCall && socket && callState.status === 'connected') {
      console.log(
        'Re-associating socket with active call:',
        storedCall.callSid
      );
      socket.emit('webrtc_call_started', {
        callSid: storedCall.callSid,
        phoneNumber: storedCall.phoneNumber,
      });
    }
  }, [socket, callState.status]);

  return {
    callState,
    deviceReady,
    startCall,
    endCall,
    resetCall,
    reassociateCall: reAssociateCall,
  };
}
