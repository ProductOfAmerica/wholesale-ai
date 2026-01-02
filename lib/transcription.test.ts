import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock the Deepgram SDK
const mockConnection = new EventEmitter();
mockConnection.send = vi.fn();
mockConnection.finish = vi.fn();

const mockListen = {
  live: vi.fn(() => mockConnection)
};

const mockDeepgramClient = {
  listen: mockListen
};

vi.mock('@deepgram/sdk', () => ({
  createClient: vi.fn(() => mockDeepgramClient),
  LiveTranscriptionEvents: {
    Open: 'open',
    Transcript: 'transcript', 
    Error: 'error',
    Close: 'close'
  }
}));

// Import after mocking
import { createTranscriptionStream } from './transcription.js';

describe('Transcription Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConnection.removeAllListeners();
  });

  it('should create a Deepgram live connection', async () => {
    const transcription = createTranscriptionStream('test-api-key');
    
    expect(mockListen.live).toHaveBeenCalledWith({
      model: 'nova-3',
      smart_format: true,
      language: 'en-US',
      punctuate: true
    });
    
    expect(transcription).toBeDefined();
  });

  it('should emit transcript event when Deepgram returns transcript result', () => {
    return new Promise<void>((resolve) => {
      const transcription = createTranscriptionStream('test-api-key');
      
      // Set up event listener
      transcription.on('transcript', (data) => {
        expect(data.speaker).toBe('unknown');
        expect(data.text).toBe('Hello world');
        expect(data.timestamp).toBeTypeOf('number');
        resolve();
      });

      // Simulate connection open
      mockConnection.emit('open');
      
      // Simulate transcript result from Deepgram
      mockConnection.emit('transcript', {
        channel: {
          alternatives: [{
            transcript: 'Hello world'
          }]
        },
        is_final: true
      });
    });
  });

  it('should emit error event when Deepgram connection errors', () => {
    return new Promise<void>((resolve) => {
      const transcription = createTranscriptionStream('test-api-key');
      
      transcription.on('error', (error) => {
        expect(error.message).toBe('Connection failed');
        resolve();
      });

      // Simulate connection error
      mockConnection.emit('error', new Error('Connection failed'));
    });
  });

  it('should allow connection to be cleanly closed', () => {
    const transcription = createTranscriptionStream('test-api-key');
    
    transcription.close();
    
    expect(mockConnection.finish).toHaveBeenCalled();
  });

  it('should handle sending audio data to connection', () => {
    const transcription = createTranscriptionStream('test-api-key');
    const audioBuffer = Buffer.from('fake audio data');
    
    // Simulate connection open
    mockConnection.emit('open');
    
    transcription.sendAudio(audioBuffer);
    
    expect(mockConnection.send).toHaveBeenCalledWith(audioBuffer);
  });
});