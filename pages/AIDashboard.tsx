/**
 * AI Dashboard Page
 * Cool interface to showcase all your AI features!
 * Shows AI Observer insights, AI Assistant proposals, and usage monitoring
 */

import React, { useState, useEffect } from 'react';
//import { aiObserver, type BusinessInsight, type DailySummary } from '../services/aiObserver';
//import { aiAssistant, type AIProposal } from '../services/aiAssistant';
//import { geminiAPIManager } from '../services/geminiAPIManager';

const AIDashboard: React.FC = () => {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [aiProposals, setAIProposals] = useState<AIProposal[]>([]);
  const [usageStats, setUsageStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'observer' | 'assistant' | 'monitoring'>('observer');

  useEffect(() => {
    loadAIDashboard();
  }, []);

  const loadAIDashboard = async () => {
    setIsLoading(true);
    try {
      // Load AI Observer summary
      const summary = await aiObserver.generateDailySummary();
      setDailySummary(summary);
      
      // Load AI Assistant proposals
      const proposals = await aiAssistant.analyzeAndPropose();
      setAIProposals(proposals);
      
      // Load usage statistics
      const stats = geminiAPIManager.getUsageStats();
      setUsageStats(stats);
      
    } catch (error) {
      console.error('Failed to load AI dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    try {
      const result = await aiAssistant.processHumanDecision({
        proposal_id: proposalId,
        human_decision: 'approve',
        human_notes: 'Approved via dashboard',
        approved_by: 'current_user', // You'd get this from auth context
        approved_at: new Date().toISOString()
      });
      
      if (result.success) {
        // Refresh proposals
        const updatedProposals = await aiAssistant.analyzeAndPropose();
        setAIProposals(updatedProposals);
        alert('✅ Proposal approved and executed!');
      } else {
        alert('❌ Failed to approve proposal: ' + result.message);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('❌ Approval failed');
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      const result = await aiAssistant.processHumanDecision({
        proposal_id: proposalId,
        human_decision: 'reject',
        human_notes: 'Rejected via dashboard',
        approved_by: 'current_user',
        approved_at: new Date().toISOString()
      });
      
      if (result.success) {
        // Refresh proposals
        const updatedProposals = await aiAssistant.analyzeAndPropose();
        setAIProposals(updatedProposals);
        alert('❌ Proposal rejected');
      }
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'insight': return '💡';
      case 'trend': return '📈';
      case 'recommendation': return '🎯';
      case 'alert': return '⚠️';
      default: return '🤖';
    }
  };

  const getProposalIcon = (type: string) => {
    switch (type) {
      case 'expense_categorization': return '📂';
      case 'stock_adjustment': return '📦';
      case 'price_optimization': return '💰';
      case 'reorder_suggestion': return '🔄';
      case 'process_improvement': return '⚡';
      default: return '🤖';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-gray-700">AI is thinking...</h2>
          <p className="text-gray-500">Analyzing your business data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI Business Assistant
          </h1>
          <p className="text-gray-600">Your intelligent chicken business companion</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('observer')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'observer'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 AI Observer
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'assistant'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🎯 AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'monitoring'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📈 AI Monitoring
            </button>
          </div>
        </div>

        {/* AI Observer Tab */}
        {activeTab === 'observer' && dailySummary && (
          <div className="space-y-6">
            {/* Daily Summary Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📊 Daily Business Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800">Sales Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₱{dailySummary.sales_total.toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600">
                    ₱{dailySummary.expenses_total.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">Profit Margin</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {dailySummary.profit_margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">💡 AI Business Insights</h2>
              <div className="space-y-4">
                {dailySummary.ai_insights.map((insight, index) => (
                  <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                        <p className="text-gray-600 mb-2">{insight.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm bg-white px-2 py-1 rounded">
                            Confidence: {insight.confidence}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(insight.generated_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🏆 Top Performing Products</h2>
              <div className="space-y-3">
                {dailySummary.top_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₱{product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🎯 AI Recommendations</h2>
              <div className="space-y-2">
                {dailySummary.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-xl">💡</span>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'assistant' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">🎯 AI Assistant Proposals</h2>
                <button
                  onClick={loadAIDashboard}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 Refresh Analysis
                </button>
              </div>

              {aiProposals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-xl font-semibold text-gray-600">All caught up!</h3>
                  <p className="text-gray-500">AI hasn't found any improvement opportunities right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiProposals.map((proposal) => (
                    <div key={proposal.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getProposalIcon(proposal.type)}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{proposal.title}</h3>
                            <p className="text-gray-600 mb-2">{proposal.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Confidence: {proposal.confidence}%</span>
                              <span>Type: {proposal.type.replace('_', ' ')}</span>
                              <span>Expires: {new Date(proposal.expires_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveProposal(proposal.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectProposal(proposal.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">AI Reasoning:</h4>
                        <p className="text-gray-700 text-sm">{proposal.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📈 AI Usage Monitoring</h2>
              
              {Object.keys(usageStats).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-600">No usage data yet</h3>
                  <p className="text-gray-500">Start using AI features to see usage statistics.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(usageStats).map(([modelId, stats]: [string, any]) => (
                    <div key={modelId} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{stats.model}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Requests:</span>
                          <span className="font-medium">{stats.requests}/{stats.rpm_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tokens:</span>
                          <span className="font-medium">{stats.tokens}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Usage:</span>
                          <span className="font-medium">{stats.usage_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(stats.usage_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Health Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔧 AI System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-semibold text-green-800">ChickenBusinessAI</h3>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-green-800">AI Observer</h3>
                  <p className="text-sm text-green-600">Active</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold text-green-800">AI Assistant</h3>
                  <p className="text-sm text-green-600">Ready</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;