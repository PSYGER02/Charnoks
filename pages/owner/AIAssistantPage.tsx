import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from '../../components/ai/ChatBubble';
import ChatInput from '../../components/ai/ChatInput';
//import PromptSuggestions from '../../components/ai/PromptSuggestions';
//import { aiStoreAdvisor } from '../../services/aiStoreAdvisor';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    isError?: boolean;
    confidence?: number;
}

const INITIAL_MESSAGE: Message = {
    id: 1,
    sender: 'ai',
    text: `Hello! I'm your AI Store Advisor - your intelligent business consultant with complete knowledge of your chicken business.

I have learned your business patterns, understand your operations, and can provide strategic advice like a experienced business consultant.

**I can help you with:**
- Real-time business performance analysis
- Strategic recommendations based on your data
- Pattern recognition and trend analysis
- Operational optimization suggestions
- Market positioning advice
- Cost reduction opportunities

**Ask me anything about your business - I understand it all!**

How can I help you optimize your chicken business today?`,
    confidence: 95
};

const AIAssistantPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('ai-chat-history');
        return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    });
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [lastMessageId, setLastMessageId] = useState<number>(INITIAL_MESSAGE.id);

    // Save to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem('ai-chat-history', JSON.stringify(messages));
    }, [messages]);

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
            // Use the new AI Store Advisor for intelligent business consultation
            const responseText = await aiStoreAdvisor.askBusinessConsultant(query, 'owner');
            const aiMessage: Message = { 
                id: Date.now() + 1, 
                text: responseText, 
                sender: 'ai',
                confidence: 85
            };
            setMessages(prev => [...prev, aiMessage]);
            setLastMessageId(aiMessage.id);
        } catch (error: any) {
            console.error('AI Store Advisor error:', error);
            // Provide intelligent fallback response
            const fallbackResponse = getIntelligentFallback(query);
            const aiMessage: Message = {
                id: Date.now() + 1,
                text: fallbackResponse,
                sender: 'ai',
                isError: true
            };
            setMessages(prev => [...prev, aiMessage]);
            setLastMessageId(aiMessage.id);
        } finally {
            setIsLoading(false);
        }
    };

    const getIntelligentFallback = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('profit')) {
            return `🔍 **Sales Analysis Request Received**

While I'm temporarily unable to access your real-time data, here's strategic guidance for your chicken business:

**Immediate Actions:**
• Check your top 3 bestselling products today
• Review yesterday's sales vs. last week same day
• Identify peak sales hours for staffing optimization

**Strategic Recommendations:**
• Focus on whole chicken sales (higher margins)
• Bundle products (chicken + seasoning/sides)
• Track customer buying patterns

I'll be back online shortly with your specific data analysis!`;

        } else if (lowerQuery.includes('expense') || lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
            return `💰 **Cost Management Consultation**

I understand you want expense insights. Here's strategic advice for chicken business cost control:

**Key Cost Centers to Monitor:**
• Feed costs (40-50% of expenses typically)
• Labor optimization during peak/slow hours
• Utility costs (refrigeration, processing equipment)
• Waste reduction (spoilage, processing efficiency)

**Immediate Actions:**
• Compare this week's feed costs vs. last month
• Review supplier contracts quarterly
• Track waste percentages daily

I'll analyze your specific expense patterns once I'm fully connected!`;

        } else if (lowerQuery.includes('stock') || lowerQuery.includes('inventory') || lowerQuery.includes('product')) {
            return `📦 **Inventory Management Consultation**

For optimal chicken business inventory control:

**Critical Monitoring:**
• Live chicken stock levels (seasonal demand varies)
• Processed products turnover rate
• Feed inventory (2-week safety stock recommended)
• Packaging materials availability

**Smart Strategies:**
• Track products selling fastest this week
• Monitor expiration dates closely
• Maintain supplier backup relationships

I'm working to reconnect with your inventory data for real-time insights!`;

        } else {
            return `🧠 **AI Store Advisor Temporarily Limited**

I'm your complete business consultant, but currently having connectivity issues. However, I can still help with:

**Available Guidance:**
• Strategic business planning
• Market positioning advice
• Operational efficiency tips
• Growth opportunity identification
• Cost optimization strategies

**Ask me about:**
• "How can I increase profit margins?"
• "What's the best time to process chickens?"
• "How to handle seasonal demand changes?"
• "Customer retention strategies"

What specific aspect of your chicken business would you like strategic advice on?`;
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
                    {messages.map((msg: Message) => (
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