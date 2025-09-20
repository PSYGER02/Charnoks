import React, { useState } from 'react';
import NoteInput from '../../components/NoteInput';
import { chickenBusinessAI } from '../../services/chickenBusinessAI';

const AITestPage: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadBusinessInsights = async () => {
    setLoadingInsights(true);
    try {
      const insights = await chickenBusinessAI.getBusinessInsights();
      setInsights(insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">🧠 Chicken Business AI Test</h1>
          <p className="text-gray-400">
            Test the AI-powered chicken business note processing system
          </p>
        </header>

        {/* Test Examples */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-bold mb-4">📚 Test Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-300">Owner Examples:</h3>
              <div className="space-y-1 text-gray-300">
                <p>• "Buy magnolia whole chicken 20 bags (10 chickens per bag)"</p>
                <p>• "Chopped 200 chickens into 35 bags parts (40 pieces each) + 10 neck bags (20 necks each)"</p>
                <p>• "Send Branch1: 3 bags + 1 neck bag"</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-300">Worker Examples:</h3>
              <div className="space-y-1 text-gray-300">
                <p>• "Branch1 cooked 1 bag"</p>
                <p>• "Leftovers: 20 pieces @35 pesos, 10 necks @15 pesos"</p>
                <p>• "Sold 15 pieces, total 525 pesos"</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Note Input - Owner */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">👑 Owner AI Input</h2>
          <NoteInput 
            userRole="owner" 
            branchId="main"
            onNoteSaved={() => console.log('Owner note saved')}
          />
        </div>

        {/* AI Note Input - Worker */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">👷 Worker AI Input</h2>
          <NoteInput 
            userRole="worker" 
            branchId="branch1"
            onNoteSaved={() => console.log('Worker note saved')}
          />
        </div>

        {/* Business Insights */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📊 Business AI Insights</h2>
            <button
              onClick={loadBusinessInsights}
              disabled={loadingInsights}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {loadingInsights ? 'Loading...' : '🔄 Refresh Insights'}
            </button>
          </div>
          
          {insights ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-medium mb-2">📝 Total Patterns</h3>
                  <p className="text-2xl font-bold text-blue-200">{insights.totalPatterns}</p>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-green-300 font-medium mb-2">🎯 Most Common</h3>
                  <p className="text-lg font-bold text-green-200 capitalize">{insights.mostCommonType}</p>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-purple-300 font-medium mb-2">🤖 Avg Confidence</h3>
                  <p className="text-2xl font-bold text-purple-200">{Math.round(insights.averageConfidence * 100)}%</p>
                </div>
              </div>
              
              {insights.suggestions.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-medium mb-3">💡 AI Suggestions</h3>
                  <ul className="space-y-2">
                    {insights.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-yellow-200">
                        <span className="text-yellow-400">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Click "Refresh Insights" to see AI business intelligence</p>
            </div>
          )}
        </div>

        {/* Development Info */}
        <div className="modern-card p-6 bg-gray-900/30">
          <h2 className="text-xl font-bold mb-4">🚀 Development Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>ChickenBusinessAI Service implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Gemini AI integration for pattern parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Enhanced notes table with AI fields</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Smart fallback parsing when AI fails</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🚧</span>
              <span>Automatic stock updates (Phase 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🚧</span>
              <span>Advanced pattern learning (Phase 3)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;