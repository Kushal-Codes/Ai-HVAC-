
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Strictly use process.env.API_KEY directly as required by the guidelines
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const bookingSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    phone: { type: Type.STRING },
    service_type: { type: Type.STRING },
    description: { type: Type.STRING },
    address: { type: Type.STRING },
    preferred_date_time: { 
      type: Type.STRING, 
      description: "Must be in format YYYY-MM-DD HH:mm. DO NOT accept ASAP or relative dates. If user says ASAP, use the next available slot you suggested." 
    },
    isComplete: { 
      type: Type.BOOLEAN, 
      description: "True if all 6 core fields are collected AND user has been shown a summary." 
    },
    isConfirmed: { 
      type: Type.BOOLEAN, 
      description: "True ONLY if the user has explicitly said 'Yes', 'Confirm', 'Proceed', or similar AFTER being shown the summary." 
    }
  },
  required: ["name", "phone", "service_type", "description", "address", "preferred_date_time", "isComplete", "isConfirmed"]
};

// Utils for Live API
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
