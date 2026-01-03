import type {Twilio as TwilioClient} from 'twilio';
import Twilio from 'twilio';

let twilioClient: TwilioClient | null = null;

export function getTwilioClient(): TwilioClient {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }

  return twilioClient;
}

export function getTwilioPhoneNumber(): string {
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioPhoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  return twilioPhoneNumber;
}

function getAuthToken(): string | undefined {
  return process.env.TWILIO_AUTH_TOKEN;
}

export interface CallOptions {
  to: string;
  streamUrl: string;
  statusCallbackUrl: string;
}

export async function initiateOutboundCall(
  options: CallOptions
): Promise<{ callSid: string; status: string }> {
  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();

  const twimlUrl = `${options.statusCallbackUrl.replace('/status', '/voice')}?streamUrl=${encodeURIComponent(options.streamUrl)}`;

  console.log('Twilio call details:');
  console.log('  From:', from);
  console.log('  TwiML URL:', twimlUrl);
  console.log('  Status Callback:', options.statusCallbackUrl);
  console.log('  Stream URL:', options.streamUrl);

  try {
    const call = await client.calls.create({
      to: options.to,
      from,
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

export async function endCall(callSid: string): Promise<void> {
  const client = getTwilioClient();

  await client.calls(callSid).update({
    status: 'completed',
  });
}

export async function getCallStatus(
  callSid: string
): Promise<{ status: string; duration: string | null }> {
  const client = getTwilioClient();

  const call = await client.calls(callSid).fetch();

  return {
    status: call.status,
    duration: call.duration,
  };
}

export function generateStreamTwiML(streamUrl: string): string {
  const response = new Twilio.twiml.VoiceResponse();

  response.say(
    { voice: 'Polly.Amy' },
    'Connected.'
  );

  const start = response.start();
  start.stream({
    url: streamUrl,
    name: 'transcription-stream',
    track: 'both_tracks',
  });

  response.pause({ length: 3600 });

  return response.toString();
}

// Skip signature validation when using tunnels (Cloudflare/ngrok modify requests)
// In production with direct Twilio access, re-enable this
export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token configured, skipping signature validation');
    return true;
  }

  return Twilio.validateRequest(authToken, signature, url, params);
}

export function generateAccessToken(identity: string): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    throw new Error('Twilio API key credentials or TwiML App SID not configured');
  }

  const AccessToken = Twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: 3600,
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false,
  });

  token.addGrant(voiceGrant);

  return token.toJwt();
}

export function generateClientTwiML(to: string, streamUrl: string): string {
  const response = new Twilio.twiml.VoiceResponse();

  const start = response.start();
  start.stream({
    url: streamUrl,
    name: 'transcription-stream',
    track: 'both_tracks',
  });

  const dial = response.dial({
    callerId: getTwilioPhoneNumber(),
    answerOnBridge: true,
  });
  dial.number(to);

  return response.toString();
}
