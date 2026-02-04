
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, bookingSchema } from '../services/geminiService';
import { Booking } from '../types';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatAssistantProps {
  masterPrompt: string;
  onClose: () => void;
  onBookingComplete: (booking: any) => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ masterPrompt, onClose, onBookingComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const initChat = async () => {
      if (!masterPrompt.trim()) {
        setMessages([{ role: 'bot', content: 'System intelligence is currently offline.' }]);
        return;
      }

      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: masterPrompt,
        }
      });
      chatRef.current = chat;

      setIsTyping(true);
      try {
        const response = await chat.sendMessage({ message: "Introduce yourself and offer to help with an HVAC service booking." });
        setMessages([{ role: 'bot', content: response.text || '' }]);
      } catch (err) {
        setMessages([{ role: 'bot', content: "Gateway Error: Unable to establish AI connection." }]);
      } finally {
        setIsTyping(false);
      }
    };

    initChat();
  }, [masterPrompt]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current || isSubmitted) return;

    const userMsg = input.trim();
    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      const botText = response.text || '';
      const finalHistory: Message[] = [...newHistory, { role: 'bot', content: botText }];
      setMessages(finalHistory);

      // Perform transaction-safe state analysis
      checkBookingStatus(finalHistory);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "An unexpected error occurred. Please repeat your last request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const checkBookingStatus = async (currentHistory: Message[]) => {
    if (isSubmitted) return;

    try {
      const ai = getGeminiClient();
      const checkResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the conversation history. Verify if the user has provided: Name, Phone, Service, Description, Address, and Date/Time. Confirm if the agent presented a summary and if the user explicitly confirmed it.\n\nCONVERSATION:\n${JSON.stringify(currentHistory)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: bookingSchema
        }
      });

      const extracted = JSON.parse(checkResponse.text || '{}');
      
      // Transaction Safety: Only submit if BOTH isComplete (all data) AND isConfirmed (user approved summary)
      if (extracted.isComplete && extracted.isConfirmed) {
        setIsSubmitted(true);
        onBookingComplete({
          name: extracted.name,
          phone: extracted.phone,
          service_type: extracted.service_type as any,
          description: extracted.description,
          address: extracted.address,
          preferred_date_time: extracted.preferred_date_time
        });
        
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: "✅ Dispatch Initialized. Your request has been permanently recorded and assigned to a technician." 
        }]);
      }
    } catch (e) {
      console.error("State extraction failed", e);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col w-96 max-h-[600px] h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest">AI Dispatch Assistant</h3>
            <p className="text-[10px] text-slate-400 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
              Synchronized with Ledger
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <input 
            type="text"
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder={isSubmitted ? "Session complete." : "Type your message..."}
            disabled={isSubmitted}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isSubmitted || !input.trim()}
            className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${isSubmitted || !input.trim() ? 'text-slate-300' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
