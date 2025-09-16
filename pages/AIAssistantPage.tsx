import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import PromptSuggestions from '../components/ai/PromptSuggestions';
import { aiService } from '../services/optimizedAIService';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    isError?: boolean;
}

const INITIAL_MESSAGE: Message = {
    id: 1,
    sender: 'ai',
    text: `Hello! I'm your AI-powered business assistant.
I have access to your sales, expenses, and product data.

**Here are a few things you can ask:**
- What were my top selling products this week?
- Summarize my expenses for the last 7 days.
- Suggest one way to improve sales.
- Give me business insights and recommendations

How can I help you today?`
};

const AIAssistantPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [lastMessageId, setLastMessageId] = useState<number>(INITIAL_MESSAGE.id);

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
        
        // Prepare history for the AI, excluding the initial prompt for brevity
        const historyForAI = messages.slice(1).map(m => ({ text: m.text, sender: m.sender as 'user' | 'ai' }));

        try {
            const responseText = await aiService.getAIResponse(query, historyForAI);
            const aiMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
            setLastMessageId(aiMessage.id);
        } catch (error: any) {
            // Provide helpful fallback responses instead of configuration errors
            const fallbackResponse = getFallbackResponse(query);
            const aiMessage: Message = {
                id: Date.now() + 1,
                text: fallbackResponse,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiMessage]);
            setLastMessageId(aiMessage.id);
        } finally {
            setIsLoading(false);
        }
    };

    const getFallbackResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
            return "Based on general business principles, here are some ways to improve sales:\n\n• Focus on your best-selling products\n• Offer promotions during slow periods\n• Improve customer service\n• Track daily sales patterns\n\nFor detailed analysis of your specific sales data, the AI service needs to be properly configured on the backend.";
        } else if (lowerQuery.includes('expense') || lowerQuery.includes('cost')) {
            return "Here are some general tips for managing expenses:\n\n• Track all expenses daily\n• Review supplier costs regularly\n• Reduce waste and spoilage\n• Monitor utility costs\n• Compare prices from different suppliers\n\nFor specific expense analysis, the AI service needs backend configuration.";
        } else if (lowerQuery.includes('product') || lowerQuery.includes('inventory')) {
            return "General inventory management tips:\n\n• Keep track of fast-moving items\n• Monitor stock levels daily\n• Rotate products to prevent spoilage\n• Maintain good supplier relationships\n• Use the Products page to manage your inventory\n\nFor detailed product insights, AI services need to be configured.";
        } else if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
            return "I can provide general business advice and tips! While the advanced AI features need backend configuration, I can still help with:\n\n• General business recommendations\n• Basic calculations\n• Best practices for retail management\n• Tips for improving operations\n\nWhat specific area would you like advice on?";
        } else {
            return "I understand you're asking about your business! While I can't access your specific data right now (AI services need backend setup), I can provide general business advice.\n\nTry asking about:\n• Sales improvement tips\n• Expense management\n• Inventory best practices\n• General business operations\n\nWhat would you like to know?";
        }
    };

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">AI Assistant</h1>
                <p className="text-text-secondary mt-1">Your intelligent business partner, ready to help with advice and insights.</p>
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