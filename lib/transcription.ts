import { EventEmitter } from 'events';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export interface TranscriptEvent {
  speaker: string;
  text: string;
  timestamp: number;
}

export class TranscriptionStream extends EventEmitter {
  private connection: any;
  private isConnected: boolean = false;

  constructor(apiKey: string) {
    super();
    
    const deepgram = createClient(apiKey);
    
    this.connection = deepgram.listen.live({
      model: 'nova-3',
      smart_format: true,
      language: 'en-US',
      punctuate: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.connection.on(LiveTranscriptionEvents.Open, () => {
      this.isConnected = true;
      this.emit('ready');
    });

    this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      if (data.channel?.alternatives?.[0]?.transcript && data.is_final) {
        const transcriptEvent: TranscriptEvent = {
          speaker: 'unknown', // For now, we don't have speaker detection
          text: data.channel.alternatives[0].transcript,
          timestamp: Date.now()
        };
        
        this.emit('transcript', transcriptEvent);
      }
    });

    this.connection.on(LiveTranscriptionEvents.Error, (error: Error) => {
      this.emit('error', error);
    });

    this.connection.on(LiveTranscriptionEvents.Close, () => {
      this.isConnected = false;
      this.emit('close');
    });
  }

  public sendAudio(audioData: Buffer): void {
    if (this.isConnected && this.connection) {
      this.connection.send(audioData);
    }
  }

  public close(): void {
    if (this.connection) {
      this.connection.finish();
    }
  }
}

export function createTranscriptionStream(apiKey: string): TranscriptionStream {
  return new TranscriptionStream(apiKey);
}