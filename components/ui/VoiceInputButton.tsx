import React from 'react';
import Spinner from './Spinner';

// Type definitions for the Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    isProcessing: boolean;
    error: string | null;
    onResetError: () => void;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, isProcessing, error, onResetError }) => {
    type Status = 'idle' | 'listening' | 'denied' | 'unsupported';
    const [status, setStatus] = React.useState<Status>('idle');
    const [isHovered, setIsHovered] = React.useState(false);
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus('unsupported');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setStatus('listening');
        recognition.onend = () => setStatus('idle');
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'not-allowed') {
                setStatus('denied');
            }
            const { sanitizeForLog } = require('../../utils/securityUtils');
            console.error('Speech recognition error:', sanitizeForLog(event.error));
        };
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            const sanitizedTranscript = transcript.replace(/[<>&"']/g, '');
            onTranscript(sanitizedTranscript);
        };
        
        recognitionRef.current = recognition;
    }, [onTranscript]);

    const handleClick = () => {
        if (error) {
            onResetError();
            return;
        }

        if (status === 'listening' || isProcessing) {
            recognitionRef.current?.stop();
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };
    
    const getButtonContent = () => {
        if (status === 'unsupported') return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <span className="text-xl">❌</span>
                </div>
                <div className="text-left">
                    <div className="font-bold text-red-300">Voice Not Supported</div>
                    <div className="text-sm text-red-200/70">Browser doesn't support speech recognition</div>
                </div>
            </div>
        );
        
        if (status === 'denied') return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                    <span className="text-xl">🔇</span>
                </div>
                <div className="text-left">
                    <div className="font-bold text-yellow-300">Microphone Access Denied</div>
                    <div className="text-sm text-yellow-200/70">Please enable microphone permission</div>
                </div>
            </div>
        );
        
        if (isProcessing) return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/30 border border-primary/50 flex items-center justify-center">
                    <Spinner size="sm" />
                </div>
                <div className="text-left">
                    <div className="font-bold text-primary">AI Processing...</div>
                    <div className="text-sm text-primary/70">Analyzing your voice input</div>
                </div>
            </div>
        );
        
        if (error) return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <span className="text-xl">⚠️</span>
                </div>
                <div className="text-left">
                    <div className="font-bold text-red-300">Error Occurred</div>
                    <div className="text-sm text-red-200/70">Tap to retry voice input</div>
                </div>
            </div>
        );
        
        if (status === 'listening') return (
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/30 border border-red-500/50 flex items-center justify-center relative">
                    <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-10 h-10 bg-red-500/20 rounded-xl animate-ping"></div>
                </div>
                <div className="text-left">
                    <div className="font-bold text-red-300">Listening...</div>
                    <div className="text-sm text-red-200/70">Speak clearly into your microphone</div>
                </div>
            </div>
        );

        return (
            <div className="flex items-center gap-4">
                <div className={`
                    w-10 h-10 rounded-xl 
                    bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10
                    border border-primary/40
                    flex items-center justify-center
                    transition-all duration-300 ease-out-quart
                    ${isHovered ? 'scale-110 shadow-glass-3' : ''}
                `}>
                    <span className="text-xl filter drop-shadow-sm">🎙️</span>
                </div>
                <div className="text-left">
                    <div className="font-bold text-text-primary">Voice Input</div>
                    <div className="text-sm text-text-secondary/80">Tap to start recording</div>
                </div>
            </div>
        );
    };

    const getButtonClass = () => {
        let baseClass = `
            revolutionary-voice-button
            glass-card-premium w-full p-6 
            font-medium transition-all duration-500 ease-out-quart
            relative overflow-hidden group
            border border-glass-border/40
            bg-gradient-to-br from-glass-light/30 via-glass-light/20 to-glass-light/10
            backdrop-blur-2xl shadow-glass-3
            ${isHovered ? 'scale-102 shadow-glass-4' : ''}
        `;
        
        if (error) return `${baseClass} 
            bg-gradient-to-br from-red-500/20 via-red-500/15 to-red-500/10
            border-red-500/50 hover:border-red-500/70
            hover:bg-gradient-to-br hover:from-red-500/25 hover:via-red-500/20 hover:to-red-500/15`;
            
        if (isProcessing || status === 'listening') return `${baseClass}
            bg-gradient-to-br from-primary/25 via-primary/20 to-primary/15
            border-primary/60 hover:border-primary/80
            hover:bg-gradient-to-br hover:from-primary/30 hover:via-primary/25 hover:to-primary/20`;
            
        if (status === 'unsupported' || status === 'denied') return `${baseClass}
            bg-gradient-to-br from-gray-500/20 via-gray-500/15 to-gray-500/10
            border-gray-500/50 cursor-not-allowed opacity-60`;
        
        return `${baseClass} hover:border-primary/60 hover:shadow-glass-4`;
    }

    return (
        <div className="revolutionary-voice-input space-y-6">
            <button 
                onClick={handleClick} 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={getButtonClass()} 
                disabled={status === 'unsupported' || status === 'denied'}
            >
                {getButtonContent()}
                
                {/* Revolutionary Shimmer Effect */}
                {(status === 'idle' && !error && !isProcessing) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl"></div>
                )}
                
                {/* Smart Glow Effect */}
                <div className={`
                    absolute inset-0 rounded-2xl pointer-events-none
                    transition-opacity duration-500
                    ${status === 'listening' ? 'opacity-100' : 'opacity-0'}
                    bg-gradient-to-r from-red-500/10 via-red-400/5 to-red-500/10
                    blur-xl -z-10
                `}></div>
            </button>
            
            {/* Enhanced Voice Tip with Revolutionary Design */}
            <div className="glass-card-premium bg-gradient-to-br from-accent/15 via-accent/10 to-accent/5 border border-accent/30 p-5 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">💡</span>
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold text-accent">Voice Input Tips</div>
                        <div className="text-sm text-accent/80 leading-relaxed">
                            Try: <span className="font-medium">"2 fries, 1 burger, 100 pesos"</span> or 
                            <span className="font-medium"> "Sold 5 chickens today"</span>
                        </div>
                    </div>
                </div>
                
                {/* Voice Wave Animation for Active State */}
                {status === 'listening' && (
                    <div className="flex items-center justify-center gap-1 mt-4">
                        <div className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '0ms' }}></div>
                        <div className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '150ms' }}></div>
                        <div className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '20px', animationDelay: '300ms' }}></div>
                        <div className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '16px', animationDelay: '450ms' }}></div>
                        <div className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '600ms' }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceInputButton;