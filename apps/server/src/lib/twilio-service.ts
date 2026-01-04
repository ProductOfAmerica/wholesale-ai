import type { Twilio as TwilioClient } from 'twilio';
import Twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  apiKeySid?: string;
  apiKeySecret?: string;
  twimlAppSid?: string;
}

export interface TwilioService {
  initiateOutboundCall: (
    options: CallOptions
  ) => Promise<{ callSid: string; status: string }>;
  endCall: (callSid: string) => Promise<void>;
  generateStreamTwiML: (streamUrl: string) => string;
  generateClientTwiML: (to: string, streamUrl: string) => string;
  generateAccessToken: (identity: string) => string;
  validateRequest: (
    signature: string,
    url: string,
    params: Record<string, string>
  ) => boolean;
}

export interface CallOptions {
  to: string;
  streamUrl: string;
  statusCallbackUrl: string;
}

export function createTwilioClient(config: TwilioConfig): TwilioClient {
  return Twilio(config.accountSid, config.authToken);
}

export function createTwilioService(
  client: TwilioClient,
  config: TwilioConfig
): TwilioService {
  async function initiateOutboundCall(
    options: CallOptions
  ): Promise<{ callSid: string; status: string }> {
    const twimlUrl = `${options.statusCallbackUrl.replace('/status', '/voice')}?streamUrl=${encodeURIComponent(options.streamUrl)}`;

    console.log('Twilio call details:');
    console.log('  From:', config.phoneNumber);
    console.log('  TwiML URL:', twimlUrl);
    console.log('  Status Callback:', options.statusCallbackUrl);
    console.log('  Stream URL:', options.streamUrl);

    try {
      const call = await client.calls.create({
        to: options.to,
        from: config.phoneNumber,
        url: twimlUrl,
        method: 'POST',
        statusCallback: options.statusCallbackUrl,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        machineDetection: 'DetectMessageEnd',
      });

      console.log('Twilio call created successfully:');
      console.log('  SID:', call.sid);
      console.log('  Status:', call.status);
      console.log('  Direction:', call.direction);
      console.log('  Answered By:', call.answeredBy);

      return {
        callSid: call.sid,
        status: call.status,
      };
    } catch (error) {
      console.error('Twilio call creation failed:', error);
      throw error;
    }
  }

  async function endCall(callSid: string): Promise<void> {
    await client.calls(callSid).update({
      status: 'completed',
    });
  }

  function generateStreamTwiML(streamUrl: string): string {
    const response = new Twilio.twiml.VoiceResponse();

    response.say({ voice: 'Polly.Amy' }, 'Connected.');

    const start = response.start();
    start.stream({
      url: streamUrl,
      name: 'transcription-stream',
      track: 'both_tracks',
    });

    response.pause({ length: 3600 });

    return response.toString();
  }

  function validateRequest(
    signature: string,
    url: string,
    params: Record<string, string>
  ): boolean {
    if (!config.authToken) {
      console.warn('No auth token configured, skipping signature validation');
      return true;
    }

    return Twilio.validateRequest(config.authToken, signature, url, params);
  }

  function generateAccessToken(identity: string): string {
    if (!config.apiKeySid || !config.apiKeySecret || !config.twimlAppSid) {
      throw new Error(
        'Twilio API key credentials or TwiML App SID not configured'
      );
    }

    const AccessToken = Twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      config.accountSid,
      config.apiKeySid,
      config.apiKeySecret,
      {
        identity,
        ttl: 3600,
      }
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: config.twimlAppSid,
      incomingAllow: false,
    });

    token.addGrant(voiceGrant);

    return token.toJwt();
  }

  function generateClientTwiML(to: string, streamUrl: string): string {
    const response = new Twilio.twiml.VoiceResponse();

    const start = response.start();
    start.stream({
      url: streamUrl,
      name: 'transcription-stream',
      track: 'both_tracks',
    });

    const dial = response.dial({
      callerId: config.phoneNumber,
      answerOnBridge: true,
    });
    dial.number(to);

    return response.toString();
  }

  return {
    initiateOutboundCall,
    endCall,
    generateStreamTwiML,
    generateClientTwiML,
    generateAccessToken,
    validateRequest,
  };
}
