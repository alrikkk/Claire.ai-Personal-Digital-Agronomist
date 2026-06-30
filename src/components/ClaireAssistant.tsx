import React, { useState, useRef, useEffect } from 'react';
import { User, Message, WeatherData } from '../types';
import { Send, Sparkles, MessageSquare, RefreshCw, Loader2, Compass, Cpu, HelpCircle } from 'lucide-react';

interface ClaireAssistantProps {
  user: User;
  weatherContext: WeatherData | null;
}

export default function ClaireAssistant({ user, weatherContext }: ClaireAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_msg',
      role: 'assistant',
      content: `Greetings! I am Claire, your elite digital agronomist. 

I have synchronized your active farm location and soil respiration coefficients. How can I help you today with crop rotations, organic disease remediations, or low-cost water balance protocols?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean suggestion prompts for farmers
  const SUGGESTION_CHIPS = [
    "How do I prevent Tomato blight naturally?",
    "Calculate irrigation for Wheat at 24°C",
    "Best organic nitrogen alternatives",
    "Identify crop rot symptoms"
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages,
          weatherContext: weatherContext
        })
      });

      const data = await response.json();
      if (data.success) {
        const assistantMsg: Message = {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to query assistant.');
      }
    } catch (err) {
      // Graceful error fallback
      const errorMsg: Message = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `My apologies, I encountered a communication lag on the agronomic server node. Let me reassure you: continue to monitor your plant stems for dark ring clusters, optimize soil drainage, and let's try that query again shortly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div id="claire_assistant_panel" className="h-full flex flex-col rounded-3xl border border-orange-200 shadow-xl shadow-orange-50 bg-[#FAFAFA] overflow-hidden relative">
      
      {/* Dynamic header banner with sunset themed colors */}
      <div className="bg-gradient-to-r from-orange-400 via-[#FF7A59] to-[#C2410C] text-white p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-white text-lg">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Claire.ai Hub</h3>
            <span className="text-[10px] text-orange-100 block font-semibold uppercase tracking-widest mt-0.5">Llama-3 Fast Compiler Engine</span>
          </div>
        </div>

        {/* Sync node badge */}
        <div className="flex items-center gap-1.5 bg-black/15 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
          <Cpu className="w-3 h-3 text-orange-200 animate-pulse" />
          Active
        </div>
      </div>

      {/* Telemetry context lock badge showing active integration */}
      {weatherContext && (
        <div className="bg-gradient-to-r from-white to-orange-50/30 border-b border-orange-50 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 font-semibold font-mono">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#FF7A59]" />
            Telemetry Context:
          </span>
          <span className="text-orange-600 font-bold">
            {weatherContext.name} ({weatherContext.temp}°C, {weatherContext.dayType})
          </span>
        </div>
      )}

      {/* Messages listing box */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAFAFA]/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            {/* Sender tag */}
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-1">
              {msg.role === 'user' ? user.fullName : 'Claire.ai Agronomist'} • {msg.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-[#FF7A59] to-[#FFB74D] text-white rounded-tr-none font-medium'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-normal'
              }`}
            >
              {/* Splitting paragraphs to keep readable formatting without using complex md renderers */}
              {msg.content.split('\n\n').map((p, pIdx) => (
                <p key={pIdx} className="mb-2 last:mb-0 whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[9px] text-slate-400 font-bold tracking-wider px-1">Claire is writing...</span>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#FF7A59] animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Running pathology model...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick suggest chips */}
      <div className="px-4 py-2 border-t border-orange-50 flex gap-1.5 overflow-x-auto bg-[#FAFAFA]/20 scrollbar-none">
        {SUGGESTION_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1 bg-white border border-orange-200 rounded-full text-[10px] font-semibold text-orange-700 hover:bg-orange-50 transition-all cursor-pointer shadow-sm"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input box form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-orange-50">
        <div className="relative">
          <input
            id="assistant_message_input"
            type="text"
            placeholder="Ask Claire about microclimates, pests, irrigation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:ring-2 focus:ring-orange-200 outline-none pr-12 transition-colors"
            required
          />
          <button
            id="btn_send_message"
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 top-1.5 w-8 h-8 bg-gradient-to-br from-orange-400 to-[#C2410C] rounded-xl text-white flex items-center justify-center text-lg shadow-sm shadow-orange-100 disabled:opacity-50 cursor-pointer"
          >
            →
          </button>
        </div>
      </form>

    </div>
  );
}
