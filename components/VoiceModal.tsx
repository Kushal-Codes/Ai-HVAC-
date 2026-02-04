
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, decodeAudioData, encodeBase64, decodeBase64, bookingSchema } from '../services/geminiService';
import { Booking } from '../types';
import { Modality } from '@google/genai';

interface VoiceModalProps {
  masterPrompt: string;
  onClose: () => void;
  // Fix: use 'any' to allow flexible object structure from AI extraction that matches App.tsx's addBooking
  onBookingComplete: (booking: any) => void;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ masterPrompt, onClose, onBookingComplete }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error' | 'ended'>('connecting');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const historyRef = useRef<string[]>([]);
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = getGeminiClient();
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('active');
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                const pcmData = encodeBase64(new Uint8Array(int16.buffer));
                // Fix: ensure data is streamed only after the session promise resolves.
                sessionPromise.then(session => session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
              checkIntervalRef.current = window.setInterval(() => {
                if (historyRef.current.length > 5) checkVoiceBookingStatus(historyRef.current);
              }, 12000);
            },
            onmessage: async (msg) => {
              const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioBase64 && outAudioContextRef.current) {
                const outCtx = outAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const buffer = await decodeAudioData(decodeBase64(audioBase64), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              if (msg.serverContent?.interrupted) {
                for (const source of sourcesRef.current.values()) try { source.stop(); } catch(e) {}
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Silently track transcription for extraction (not displayed)
              if (msg.serverContent?.outputTranscription) {
                historyRef.current.push(`Agent: ${msg.serverContent.outputTranscription.text}`);
              }
              if (msg.serverContent?.inputTranscription) {
                historyRef.current.push(`User: ${msg.serverContent.inputTranscription.text}`);
              }

              if (msg.serverContent?.turnComplete) {
                checkVoiceBookingStatus(historyRef.current);
              }
            },
            onerror: () => setStatus('error'),
            onclose: () => setStatus('ended')
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: masterPrompt,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) {
        setStatus('error');
      }
    };

    startSession();
    return () => {
      if (checkIntervalRef.current) window.clearInterval(checkIntervalRef.current);
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outAudioContextRef.current) outAudioContextRef.current.close();
    };
  }, [masterPrompt]);

  const checkVoiceBookingStatus = async (currentHistory: string[]) => {
    if (isSubmitted || currentHistory.length < 5) return;
    try {
      const ai = getGeminiClient();
      const checkResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this conversation. If all data (name, phone, type, problem, address, date/time) is present, return isComplete: true. Format date/time precisely as YYYY-MM-DD HH:mm. \n\n${currentHistory.join('\n')}`,
        config: { responseMimeType: 'application/json', responseSchema: bookingSchema }
      });
      const extracted = JSON.parse(checkResponse.text || '{}');
      if (extracted.isComplete) {
        setIsSubmitted(true);
        onBookingComplete({
          name: extracted.name,
          phone: extracted.phone,
          service_type: extracted.service_type as any,
          description: extracted.description,
          address: extracted.address,
          preferred_date_time: extracted.preferred_date_time
        });
      }
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 text-center">
          <div className="flex justify-center mb-10">
            <div className={`w-36 h-36 rounded-full flex items-center justify-center relative transition-all duration-700 ${
              status === 'active' ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.4)]' : status === 'error' ? 'bg-red-50' : 'bg-slate-100'
            }`}>
              {status === 'active' && !isSubmitted && (
                <div className="absolute inset-0 rounded-full border border-blue-400 animate-[ping_2s_infinite] opacity-30"></div>
              )}
              {isSubmitted ? (
                <svg className="h-16 w-16 text-white animate-in zoom-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className={`h-16 w-16 ${status === 'active' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">
            {isSubmitted ? 'Booking Confirmed' : status === 'connecting' ? 'Connecting...' : status === 'active' ? 'ArcticFlow Active' : 'Offline'}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 px-6">
            {isSubmitted ? 'We have successfully secured your appointment. You can now close this call.' : status === 'active' ? 'Your smart assistant is listening. Please speak naturally to secure your slot.' : 'Please wait while we establish a secure line.'}
          </p>

          <button onClick={onClose} className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${status === 'active' && !isSubmitted ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}>
            {status === 'active' && !isSubmitted ? 'End Call' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceModal;
