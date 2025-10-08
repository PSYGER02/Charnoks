/**
 * AI Store Advisor Dashboard
 * Your business consultant interface - like having a customer service agent for your business!
 */

// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Activity,
  Clock
} from 'lucide-react';
import { aiStoreAdvisor, type ContextualAdvice } from '../services/aiStoreAdvisor';

interface ChatMessage {
  id: string;
  type: 'user' | 'advisor';
  message: string;
  timestamp: Date;
  confidence?: number;
}

interface Props {
  userRole: 'owner' | 'worker';
}

export default function AIStoreAdvisorDashboard({ userRole }: Props) {
  const [currentAdvice, setCurrentAdvice] = useState<ContextualAdvice[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'advisor' | 'monitoring' | 'chat'>('advisor');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialAdvice();
    
    // Auto-refresh business monitoring
    const interval = setInterval(() => {
      if (selectedTab === 'monitoring') {
        loadBusinessMonitoring();
      }
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [userRole, selectedTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadInitialAdvice = async () => {
    setIsLoading(true);
    try {
      const advice = await aiStoreAdvisor.getBusinessAdvice(userRole);
      setCurrentAdvice(advice);
      
      // Add welcome message to chat
      if (chatMessages.length === 0) {
        setChatMessages([{
          id: Date.now().toString(),
          type: 'advisor',
          message: `Hello! I'm your AI Store Advisor. I understand your chicken business inside and out. How can I help you today?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to load initial advice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessMonitoring = async () => {
    try {
      const monitoring = await aiStoreAdvisor.monitorBusinessHealth();
      setCurrentAdvice(monitoring);
    } catch (error) {
      console.error('Failed to load business monitoring:', error);
    }
  };

  const askBusinessQuestion = async () => {
    if (!currentQuestion.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentQuestion,
      timestamp: new Date()
    };

    setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await aiStoreAdvisor.askBusinessConsultant(currentQuestion, userRole);
      
      setTimeout(() => {
        const advisorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'advisor',
          message: response,
          timestamp: new Date(),
          confidence: 85
        };
        
        setChatMessages((prev: ChatMessage[]) => [...prev, advisorMessage]);
        setIsTyping(false);
      }, 1000); // Simulate thinking time

    } catch (error) {
      console.error('Failed to get business consultation:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'advisor',
        message: "I'm having trouble accessing the business data right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getAdviceIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-green-500" />;
      case 'optimization': return <Target className="h-5 w-5 text-blue-500" />;
      default: return <TrendingUp className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const quickQuestions = userRole === 'owner' ? [
    "How is my business performing today?",
    "What should I focus on this week?",
    "Are there any cost optimization opportunities?",
    "Which products are most profitable?",
    "How can I improve sales?"
  ] : [
    "What tasks should I prioritize?",
    "Any stock items running low?",
    "Best practices for today's sales?",
    "How can I improve efficiency?",
    "Any customer service tips?"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Store Advisor</h1>
          </div>
          <p className="text-gray-600">
            Your intelligent business consultant with complete knowledge of your chicken business
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'advisor', label: 'Business Advisor', icon: Brain },
            { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
            { id: 'chat', label: 'Consultation Chat', icon: MessageCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab.id 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Advisor Tab */}
        {selectedTab === 'advisor' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Current Business Insights
              </h2>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Analyzing your business...</p>
                </div>
              ) : currentAdvice.length > 0 ? (
                <div className="grid gap-4">
                  {currentAdvice.map((advice: ContextualAdvice, index: number) => (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-lg ${getPriorityColor(advice.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getAdviceIcon(advice.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{advice.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              advice.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              advice.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              advice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {advice.priority}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{advice.message}</p>
                          {advice.action_suggested && (
                            <div className="bg-white bg-opacity-50 p-2 rounded">
                              <strong>Suggested Action:</strong> {advice.action_suggested}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Confidence: {advice.confidence}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No specific advice at the moment. Your business is running smoothly!</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={loadInitialAdvice}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Refresh Business Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {selectedTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Live Business Monitoring
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              {currentAdvice.length > 0 ? (
                <div className="space-y-4">
                  {currentAdvice.map((alert: ContextualAdvice, index: number) => (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-lg ${getPriorityColor(alert.priority)}`}
                    >
                      <div className="flex items-center gap-3">
                        {getAdviceIcon(alert.type)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <p className="text-gray-700 mt-1">{alert.message}</p>
                          {alert.action_suggested && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Action:</strong> {alert.action_suggested}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {alert.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All systems normal. No alerts at this time.</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={loadBusinessMonitoring}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Refresh Monitoring
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {selectedTab === 'chat' && (
          <div className="space-y-6">
            {/* Quick Questions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Quick Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(question)}
                    className="text-left p-3 text-sm border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Business Consultation Chat
              </h2>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
                {chatMessages.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                        {message.confidence && ` • ${message.confidence}% confidence`}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askBusinessQuestion()}
                  placeholder="Ask your AI business advisor anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={askBusinessQuestion}
                  disabled={isLoading || !currentQuestion.trim()}
                  className="px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  {isLoading ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}