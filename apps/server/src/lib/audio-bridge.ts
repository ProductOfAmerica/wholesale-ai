import type {WebSocket} from 'ws';

const MULAW_DECODE_TABLE = new Int16Array([
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956, -23932,
  -22908, -21884, -20860, -19836, -18812, -17788, -16764, -15996, -15484,
  -14972, -14460, -13948, -13436, -12924, -12412, -11900, -11388, -10876,
  -10364, -9852, -9340, -8828, -8316, -7932, -7676, -7420, -7164, -6908, -6652,
  -6396, -6140, -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092, -3900,
  -3772, -3644, -3516, -3388, -3260, -3132, -3004, -2876, -2748, -2620, -2492,
  -2364, -2236, -2108, -1980, -1884, -1820, -1756, -1692, -1628, -1564, -1500,
  -1436, -1372, -1308, -1244, -1180, -1116, -1052, -988, -924, -876, -844, -812,
  -780, -748, -716, -684, -652, -620, -588, -556, -524, -492, -460, -428, -396,
  -372, -356, -340, -324, -308, -292, -276, -260, -244, -228, -212, -196, -180,
  -164, -148, -132, -120, -112, -104, -96, -88, -80, -72, -64, -56, -48, -40,
  -32, -24, -16, -8, 0, 32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
  23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764, 15996, 15484, 14972,
  14460, 13948, 13436, 12924, 12412, 11900, 11388, 10876, 10364, 9852, 9340,
  8828, 8316, 7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140, 5884, 5628, 5372,
  5116, 4860, 4604, 4348, 4092, 3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
  2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980, 1884, 1820, 1756, 1692, 1628,
  1564, 1500, 1436, 1372, 1308, 1244, 1180, 1116, 1052, 988, 924, 876, 844, 812,
  780, 748, 716, 684, 652, 620, 588, 556, 524, 492, 460, 428, 396, 372, 356,
  340, 324, 308, 292, 276, 260, 244, 228, 212, 196, 180, 164, 148, 132, 120,
  112, 104, 96, 88, 80, 72, 64, 56, 48, 40, 32, 24, 16, 8, 0,
]);

export function mulawToLinear16(mulawData: Buffer): Buffer {
  const linear16Data = Buffer.alloc(mulawData.length * 2);

  for (let i = 0; i < mulawData.length; i++) {
    const sample = MULAW_DECODE_TABLE[mulawData[i]];
    linear16Data.writeInt16LE(sample, i * 2);
  }

  return linear16Data;
}

export function resample8kTo16k(input: Buffer): Buffer {
  const inputSamples = input.length / 2;
  const outputSamples = inputSamples * 2;
  const output = Buffer.alloc(outputSamples * 2);

  for (let i = 0; i < inputSamples; i++) {
    const sample = input.readInt16LE(i * 2);
    const nextSample =
      i < inputSamples - 1 ? input.readInt16LE((i + 1) * 2) : sample;
    const interpolated = Math.round((sample + nextSample) / 2);

    output.writeInt16LE(sample, i * 4);
    output.writeInt16LE(interpolated, i * 4 + 2);
  }

  return output;
}

export function twilioToDeepgram(mulawBase64: string): Buffer {
  const mulawBuffer = Buffer.from(mulawBase64, 'base64');
  const linear16_8k = mulawToLinear16(mulawBuffer);
  return resample8kTo16k(linear16_8k);
}

export function linear16ToMulaw(linear16Data: Buffer): Buffer {
  const mulawData = Buffer.alloc(linear16Data.length / 2);

  for (let i = 0; i < mulawData.length; i++) {
    const sample = linear16Data.readInt16LE(i * 2);
    mulawData[i] = linear16SampleToMulaw(sample);
  }

  return mulawData;
}

function linear16SampleToMulaw(sample: number): number {
  const BIAS = 0x84;
  const CLIP = 32635;
  const sign = sample < 0 ? 0x80 : 0;

  if (sample < 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;

  sample = sample + BIAS;

  let exponent = 7;
  for (
    let expMask = 0x4000;
    (sample & expMask) === 0 && exponent > 0;
    exponent--, expMask >>= 1
  ) {}

  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  const mulawByte = ~(sign | (exponent << 4) | mantissa);

  return mulawByte & 0xff;
}

export function resample16kTo8k(input: Buffer): Buffer {
  const inputSamples = input.length / 2;
  const outputSamples = Math.floor(inputSamples / 2);
  const output = Buffer.alloc(outputSamples * 2);

  for (let i = 0; i < outputSamples; i++) {
    const sample = input.readInt16LE(i * 4);
    output.writeInt16LE(sample, i * 2);
  }

  return output;
}

export function deepgramToTwilio(linear16_16k: Buffer): string {
  const linear16_8k = resample16kTo8k(linear16_16k);
  const mulaw = linear16ToMulaw(linear16_8k);
  return mulaw.toString('base64');
}

export interface AudioBridge {
  streamSid: string;
  callSid: string;
  twilioWs: WebSocket;
  deepgramWs: WebSocket | null;
  onTranscript: (transcript: string, isFinal: boolean) => void;
}

const activeBridges = new Map<string, AudioBridge>();

export function createAudioBridge(
  streamSid: string,
  callSid: string,
  twilioWs: WebSocket,
  onTranscript: (transcript: string, isFinal: boolean) => void
): AudioBridge {
  const bridge: AudioBridge = {
    streamSid,
    callSid,
    twilioWs,
    deepgramWs: null,
    onTranscript,
  };

  activeBridges.set(streamSid, bridge);
  return bridge;
}

export function getAudioBridge(streamSid: string): AudioBridge | undefined {
  return activeBridges.get(streamSid);
}

export function removeAudioBridge(streamSid: string): void {
  const bridge = activeBridges.get(streamSid);
  if (bridge) {
    if (bridge.deepgramWs) {
      bridge.deepgramWs.close();
    }
    activeBridges.delete(streamSid);
  }
}

export function getAllBridges(): Map<string, AudioBridge> {
  return activeBridges;
}

export function sendAudioToTwilio(streamSid: string, audioData: Buffer): void {
  const bridge = activeBridges.get(streamSid);
  if (!bridge || bridge.twilioWs.readyState !== 1) {
    return;
  }

  const mulawBase64 = deepgramToTwilio(audioData);

  const message = JSON.stringify({
    event: 'media',
    streamSid: bridge.streamSid,
    media: {
      payload: mulawBase64,
    },
  });

  bridge.twilioWs.send(message);
}
