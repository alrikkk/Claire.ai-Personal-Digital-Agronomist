import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message, WeatherData, ApiProviderConfig } from '../types';
import { Send, Sparkles, MessageSquare, RefreshCw, Loader2, Compass, Cpu, HelpCircle, Key, Settings2, Mic, MicOff, Volume2, VolumeX, Radio, AlertCircle, Check } from 'lucide-react';
import { getSavedApiConfig, getApiConfigHeaders, API_CONFIG_CHANGED_EVENT, PROVIDER_PRESETS } from '../utils/apiConfig';
import { findMatchingCropPathology, formatCropPathologyResponse } from '../data/cropPathologyDatabase';

interface ClaireAssistantProps {
  user: User;
  weatherContext: WeatherData | null;
  onOpenApiSettings?: () => void;
}

// Check for Web Speech API browser availability
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

export default function ClaireAssistant({ user, weatherContext, onOpenApiSettings }: ClaireAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_msg',
      role: 'assistant',
      content: `Greetings! I am Claire, your digital agronomist.

I have synchronized your active farm location and soil conditions. You can type or tap the microphone for hands-free voice queries while working in the field!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiProviderConfig | null>(getSavedApiConfig());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Web Speech API states for hands-free field interaction
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isHandsFreeAudioEnabled, setIsHandsFreeAudioEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSupport = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setIsSpeechSupported(hasSupport);
    }
  }, []);

  // Listen to API config updates
  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setApiConfig(e.detail || getSavedApiConfig());
    };
    window.addEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
    return () => window.removeEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
  }, []);

  // Clean up speech recognition & speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to Speech playback for field convenience
  const speakText = useCallback((text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (speakingMessageId === msgId) {
      setSpeakingMessageId(null);
      return;
    }

    // Clean markdown asterisks and code tokens for natural acoustic readout
    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setSpeakingMessageId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Clean suggestion prompts for farmers
  const SUGGESTION_CHIPS = [
    "How do I prevent Tomato blight naturally?",
    "Calculate irrigation for Wheat at 24°C",
    "Best organic nitrogen alternatives",
    "Identify crop rot symptoms"
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Stop listening if currently active
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
    setInterimTranscript('');
    setSpeechError(null);

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
      const customHeaders = getApiConfigHeaders();
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          ...customHeaders
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

        // If hands-free voice audio readout is enabled, automatically speak the answer
        if (isHandsFreeAudioEnabled) {
          setTimeout(() => {
            speakText(assistantMsg.content, assistantMsg.id);
          }, 300);
        }
      } else {
        throw new Error(data.error || 'Failed to query assistant.');
      }
    } catch (err) {
      // Graceful local agronomic knowledge fallback using verified database
      const clientMatches = findMatchingCropPathology(userMsg.content);
      let fallbackText = `My apologies, I encountered a communication lag on the agronomic server node. Let me reassure you: continue to monitor your plant stems for dark ring clusters, optimize soil drainage, and let's try that query again shortly!`;

      if (clientMatches.length > 0) {
        fallbackText = formatCropPathologyResponse(clientMatches[0], userMsg.content);
      }

      const errorMsg: Message = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (isHandsFreeAudioEnabled) {
        setTimeout(() => {
          speakText(errorMsg.content, errorMsg.id);
        }, 300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Voice Recognition using Web Speech API
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (finalTranscript.trim()) {
          setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
          setInterimTranscript('');
          setIsListening(false);
          // Optional auto-submit when clear hands-free command is detected
          handleSendMessage(finalTranscript.trim());
        } else {
          setInterimTranscript(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition Error]', event.error);
        setIsListening(false);
        setInterimTranscript('');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Tap the mic and speak clearly.');
        } else if (event.error === 'network') {
          setSpeechError('Network connection needed for voice recognition.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[Speech Init Error]', err);
      setIsListening(false);
      setSpeechError('Could not start voice recognition. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const activeProviderName = apiConfig?.provider 
    ? (PROVIDER_PRESETS[apiConfig.provider]?.name || apiConfig.provider)
    : null;

  return (
    <div id="claire_assistant_panel" className="h-full flex flex-col rounded-3xl border border-orange-200/80 shadow-lg shadow-orange-500/5 bg-white overflow-hidden relative">
      
      {/* Dynamic header banner with sleek modern sunset styling */}
      <div className="bg-gradient-to-r from-orange-500 via-[#FF7A59] to-[#ea580c] text-white px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold tracking-tight text-white truncate">
                Claire.ai Hub
              </h3>
              {apiConfig && apiConfig.isActive ? (
                <span className="bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0">
                  Live Key
                </span>
              ) : (
                <span className="bg-white/20 text-orange-100 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-semibold shrink-0">
                  Ready
                </span>
              )}
            </div>
            <span className="text-[10px] text-orange-100/90 block font-medium truncate mt-0.5">
              {apiConfig && apiConfig.isActive 
                ? `${activeProviderName} • ${apiConfig.model || 'Connected'}`
                : 'Digital Agronomist • Llama & Gemini'}
            </span>
          </div>
        </div>

        {/* Right Header Action Buttons: Voice readout toggle & API Key button */}
        <div className="flex items-center gap-1.5">
          {/* Hands-free Voice Readout Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isHandsFreeAudioEnabled;
              setIsHandsFreeAudioEnabled(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setSpeakingMessageId(null);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer shadow-2xs active:scale-95 border ${
              isHandsFreeAudioEnabled 
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-amber-400/20' 
                : 'bg-black/20 hover:bg-black/30 border-white/15 text-white'
            }`}
            title={isHandsFreeAudioEnabled ? 'Hands-Free Voice Auto-Readout ON' : 'Turn ON Hands-Free Voice Auto-Readout'}
          >
            {isHandsFreeAudioEnabled ? <Volume2 className="w-3 h-3 text-slate-900" /> : <VolumeX className="w-3 h-3 text-white/70" />}
            <span className="hidden sm:inline font-mono">{isHandsFreeAudioEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* API Key Connection Pill Button */}
          <button
            type="button"
            onClick={onOpenApiSettings}
            className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 border border-white/15 px-2.5 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer text-white shrink-0 shadow-2xs active:scale-95"
            title="Configure custom API keys (Groq, Gemini, OpenRouter, Mistral, Cerebras, DeepSeek)"
          >
            <Key className="w-3 h-3 text-amber-200" />
            <span className="hidden xs:inline">{apiConfig?.isActive ? 'Custom API' : 'Connect Key'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry context lock badge showing active integration */}
      {weatherContext && (
        <div className="bg-orange-50/50 border-b border-orange-100/80 px-3.5 py-1.5 flex items-center justify-between text-[10px] text-slate-600 font-medium shrink-0">
          <span className="flex items-center gap-1 text-slate-500 font-mono">
            <Compass className="w-3 h-3 text-[#FF7A59]" />
            Location:
          </span>
          <span className="text-orange-700 font-bold font-mono">
            {weatherContext.name} • {weatherContext.temp}°C • {weatherContext.dayType}
          </span>
        </div>
      )}

      {/* Live Voice Status / Error Banner */}
      {isListening && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-medium animate-pulse shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Listening for field question... {interimTranscript && `"${interimTranscript}"`}</span>
          </div>
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded font-mono font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {speechError && (
        <div className="bg-rose-50 border-b border-rose-100 px-3.5 py-2 flex items-center justify-between text-[11px] text-rose-700 shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSpeechError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages listing box */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            {/* Sender tag with audio read-aloud option */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {msg.role === 'user' ? (user.fullName || 'Farmer') : 'Claire.ai'} • {msg.timestamp}
              </span>
              {msg.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => speakText(msg.content, msg.id)}
                  className={`p-0.5 rounded text-slate-400 hover:text-orange-600 transition-colors cursor-pointer ${
                    speakingMessageId === msg.id ? 'text-orange-600 animate-pulse' : ''
                  }`}
                  title={speakingMessageId === msg.id ? 'Stop reading' : 'Read aloud for hands-free listening'}
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-orange-500 to-[#FF7A59] text-white rounded-tr-xs font-medium'
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs font-normal'
              }`}
            >
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
            <span className="text-[9px] text-slate-400 font-bold tracking-wider px-1">Claire is analyzing...</span>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Computing agronomic response...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick suggest chips */}
      <div className="px-3 py-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto bg-white shrink-0 scrollbar-none">
        {SUGGESTION_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-full text-[10px] font-semibold text-slate-700 hover:text-orange-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input box form with Web Speech API Voice Command Microphone */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 shrink-0">
        <div className="relative flex items-center gap-1.5">
          
          {/* Hands-free Microphone button */}
          <button
            id="btn_voice_command"
            type="button"
            onClick={toggleSpeechRecognition}
            disabled={isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300'
                : 'bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-200'
            }`}
            title={
              isListening
                ? 'Listening... Click to stop or finish speaking'
                : isSpeechSupported
                ? 'Click for hands-free voice command (Web Speech API)'
                : 'Voice recognition not supported in this browser'
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input */}
          <div className="relative flex-1 flex items-center">
            <input
              id="assistant_message_input"
              type="text"
              placeholder={isListening ? 'Listening to your speech...' : 'Ask or speak hands-free (e.g. Tomato blight, soil moisture)...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none pr-10 transition-all placeholder:text-slate-400 font-medium ${
                isListening ? 'bg-orange-50/50 border-orange-300' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <button
              id="btn_send_message"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-1.5 w-7 h-7 bg-gradient-to-tr from-orange-500 to-[#FF7A59] hover:from-orange-600 hover:to-[#f06846] rounded-lg text-white flex items-center justify-center shadow-xs disabled:opacity-40 transition-all cursor-pointer"
              title="Send query (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </form>

    </div>
  );
}

