import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import PromptSuggestions from '../components/ai/PromptSuggestions';
import { getAIAssistantResponse } from '../services/firebaseService';
import { ConfigValidator } from '../utils/configValidator';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    isError?: boolean;
}

const getInitialMessage = (isAIConfigured: boolean): Message => ({
    id: 1,
    sender: 'ai',
    text: isAIConfigured ? 
        `Hello! I'm your AI-powered business assistant.
I have access to your sales, expenses, and product data.

**Here are a few things you can ask:**
- What were my top selling products this week?
- Summarize my expenses for the last 7 days.
- Suggest one way to improve sales.

How can I help you today?` :
        `Hello! I'm your AI assistant, but I'm currently not configured.

**To enable AI features:**
- Configure your Gemini API key in system settings
- Once configured, I can help analyze your business data

**For now, I can provide basic responses:**
- General business advice
- Basic calculations
- Simple recommendations

How can I help you today?`
});

const AIAssistantPage: React.FC = () => {
    const [isAIConfigured, setIsAIConfigured] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [lastMessageId, setLastMessageId] = useState<number>(1);

    // Check AI configuration on mount
    useEffect(() => {
        const checkAIConfig = async () => {
            const geminiValidation = ConfigValidator.validateGemini();
            const isConfigured = geminiValidation.isValid;
            setIsAIConfigured(isConfigured);
            
            const initialMessage = getInitialMessage(isConfigured);
            setMessages([initialMessage]);
            setLastMessageId(initialMessage.id);
        };
        
        checkAIConfig();
    }, []);

    useEffect(() => {
        // Scroll to the latest message
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (query: string) => {
        if (!query.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), text: query, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        try {
            if (!isAIConfigured) {
                // Provide basic fallback responses when AI is not configured
                const fallbackResponse = getFallbackResponse(query);
                const aiMessage: Message = { id: Date.now() + 1, text: fallbackResponse, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
                setLastMessageId(aiMessage.id);
            } else {
                // Prepare history for the AI, excluding the initial prompt for brevity
                const historyForAI = messages.slice(1).map(m => ({ text: m.text, sender: m.sender as 'user' | 'ai' }));
                
                const responseText = await getAIAssistantResponse(query, historyForAI);
                const aiMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
                setLastMessageId(aiMessage.id);
            }
        } catch (error: any) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                text: isAIConfigured ? 
                    (error.message || "Sorry, I'm having trouble connecting to the AI service. Please try again later.") :
                    "AI service is not configured. Please set up your Gemini API key in system settings.",
                sender: 'ai',
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
            setLastMessageId(errorMessage.id);
        } finally {
            setIsLoading(false);
        }
    };

    const getFallbackResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
            return "I'd love to help analyze your sales data, but I need to be configured with an AI API key first. Once set up, I can provide detailed sales insights and trends.";
        } else if (lowerQuery.includes('expense') || lowerQuery.includes('cost')) {
            return "To analyze your expenses and provide cost optimization suggestions, I need access to AI services. Please configure your Gemini API key in the system settings.";
        } else if (lowerQuery.includes('product') || lowerQuery.includes('inventory')) {
            return "I can help with product analysis once I'm properly configured. For now, you can manage your products through the Products page.";
        } else if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
            return "Currently, I'm running in basic mode. To unlock my full potential including business analysis, sales forecasting, and personalized recommendations, please configure the Gemini API key in your system settings.";
        } else {
            return "I understand you're asking about your business, but I need to be configured with an AI API key to provide detailed insights. Once configured, I can help with sales analysis, expense tracking, inventory management, and much more!";
        }
    };

    return (
        <div className="space-y-8">
            {/* AI Configuration Status */}
            {!isAIConfigured && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-blue-400 mr-3">🤖</span>
                            <div>
                                <h3 className="text-blue-300 font-medium">AI Assistant - Basic Mode</h3>
                                <p className="text-blue-400/80 text-sm">
                                    Configure Gemini API key to unlock full AI capabilities.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                // This would open system settings - for now just show info
                                alert('Go to System Settings to configure your Gemini API key');
                            }}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Configure
                        </button>
                    </div>
                </div>
            )}

            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">AI Assistant</h1>
                <p className="text-text-secondary mt-1">
                    {isAIConfigured ? 
                        'Your intelligent business partner, powered by Gemini.' :
                        'Basic AI assistant - configure Gemini API for full features.'
                    }
                </p>
            </header>

            <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-card-bg/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg p-4 sm:p-6">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg) => (
                        <ChatBubble
                            key={msg.id}
                            sender={msg.sender}
                            text={msg.text}
                            isError={msg.isError}
                            animate={msg.sender === 'ai' && msg.id === lastMessageId && !msg.isError}
                        />
                    ))}
                    {isLoading && <ChatBubble sender="ai" text="" isTyping />}
                    <div />
                </div>

                <div className="mt-6 flex-shrink-0">
                    <PromptSuggestions onPromptClick={handleSendMessage} />
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPage;