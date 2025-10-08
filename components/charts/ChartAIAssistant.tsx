import React, { useState, useEffect, useRef } from 'react';
import RevolutionaryChart from './RevolutionaryChart';
import Chart3D from './Chart3D';

interface ChartAIAssistantProps {
  data?: any[];
  onChartGenerated?: (chartConfig: any) => void;
  className?: string;
}

interface ChartSuggestion {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | '3d-bar';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  preview: any[];
}

interface AIInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data?: any;
}

const ChartAIAssistant: React.FC<ChartAIAssistantProps> = ({
  data = [],
  onChartGenerated,
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chartHistory, setChartHistory] = useState<any[]>([]);

  // Sample data for demo
  const sampleData = data.length > 0 ? data : [
    { name: 'Jan', sales: 45000, users: 1200, conversion: 3.2 },
    { name: 'Feb', sales: 52000, users: 1350, conversion: 3.8 },
    { name: 'Mar', sales: 48000, users: 1100, conversion: 4.1 },
    { name: 'Apr', sales: 61000, users: 1480, conversion: 4.5 },
    { name: 'May', sales: 55000, users: 1320, conversion: 4.2 },
    { name: 'Jun', sales: 67000, users: 1600, conversion: 4.8 }
  ];

  // AI Analysis Functions
  const analyzeData = async (inputData: any[]) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate suggestions based on data characteristics
    const suggestions: ChartSuggestion[] = [
      {
        id: 'sales-trend',
        type: 'line',
        title: 'Sales Trend Analysis',
        description: 'Track sales performance over time',
        confidence: 95,
        reasoning: 'Time-series data with growth pattern detected',
        preview: inputData.map(d => ({ name: d.name, value: d.sales }))
      },
      {
        id: 'user-distribution',
        type: 'bar',
        title: 'User Growth Comparison',
        description: 'Compare user acquisition month-over-month',
        confidence: 88,
        reasoning: 'Discrete values suitable for bar comparison',
        preview: inputData.map(d => ({ name: d.name, value: d.users }))
      },
      {
        id: 'conversion-performance',
        type: 'area',
        title: 'Conversion Rate Performance',
        description: 'Visualize conversion rate improvements',
        confidence: 92,
        reasoning: 'Continuous improvement trend identified',
        preview: inputData.map(d => ({ name: d.name, value: d.conversion }))
      },
      {
        id: '3d-sales-visualization',
        type: '3d-bar',
        title: '3D Sales Visualization',
        description: 'Interactive 3D representation of sales data',
        confidence: 85,
        reasoning: 'Enhanced visual impact for presentation',
        preview: inputData.map(d => ({ name: d.name, value: d.sales }))
      }
    ];

    // Generate insights
    const insights: AIInsight[] = [
      {
        type: 'trend',
        title: 'Strong Growth Trajectory',
        description: 'Sales show consistent upward trend with 49% growth from Jan to Jun',
        impact: 'high'
      },
      {
        type: 'anomaly',
        title: 'March Dip Detected',
        description: 'Sales dropped by 8% in March, requires investigation',
        impact: 'medium'
      },
      {
        type: 'correlation',
        title: 'Users vs Conversion Rate',
        description: 'Strong positive correlation (0.87) between user count and conversion',
        impact: 'high'
      },
      {
        type: 'forecast',
        title: 'July Projection',
        description: 'Predicted sales: $71,500 based on current trend',
        impact: 'medium'
      }
    ];

    setSuggestions(suggestions);
    setInsights(insights);
    setIsAnalyzing(false);
  };

  // Natural Language Processing
  const processNaturalLanguage = (query: string) => {
    const keywords = query.toLowerCase();
    
    if (keywords.includes('sales') && keywords.includes('trend')) {
      setSelectedSuggestion('sales-trend');
    } else if (keywords.includes('user') || keywords.includes('growth')) {
      setSelectedSuggestion('user-distribution');
    } else if (keywords.includes('conversion') || keywords.includes('rate')) {
      setSelectedSuggestion('conversion-performance');
    } else if (keywords.includes('3d') || keywords.includes('interactive')) {
      setSelectedSuggestion('3d-sales-visualization');
    }
  };

  // Voice Recognition (simulated)
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setNaturalLanguageQuery('Show me sales trends over time');
        processNaturalLanguage('Show me sales trends over time');
        setIsListening(false);
      }, 3000);
    }
  };

  // Initialize with data analysis
  useEffect(() => {
    if (sampleData.length > 0) {
      analyzeData(sampleData);
    }
  }, []);

  // Handle natural language query
  useEffect(() => {
    if (naturalLanguageQuery) {
      processNaturalLanguage(naturalLanguageQuery);
    }
  }, [naturalLanguageQuery]);

  const selectedSuggestionData = suggestions.find(s => s.id === selectedSuggestion);

  return (
    <div className={`chart-ai-assistant space-y-8 ${className}`}>
      {/* AI Assistant Header */}
      <div className="glass-card-premium p-6 rounded-2xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            🤖
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">AI Chart Assistant</h2>
            <p className="text-text-secondary">Intelligent data visualization recommendations</p>
          </div>
          
          {isAnalyzing && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Natural Language Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                placeholder="Describe what chart you want... (e.g., 'Show sales trends', 'Compare user growth')"
                className="w-full px-4 py-3 rounded-xl glass-card bg-glass-light/30 border border-glass-border/40 text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                onKeyPress={(e) => e.key === 'Enter' && processNaturalLanguage(naturalLanguageQuery)}
              />
              
              {naturalLanguageQuery && (
                <button
                  onClick={() => processNaturalLanguage(naturalLanguageQuery)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  ✨
                </button>
              )}
            </div>
            
            <button
              onClick={toggleVoiceInput}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                ${isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              🎤
            </button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-sm text-text-secondary animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Listening for voice input...
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-text-primary">AI Recommendations</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`
                  glass-card p-5 rounded-xl border transition-all duration-300 cursor-pointer
                  ${selectedSuggestion === suggestion.id
                    ? 'border-primary-500/60 bg-primary-500/10 shadow-lg scale-105'
                    : 'border-glass-border/40 bg-glass-light/20 hover:bg-glass-light/30'
                  }
                `}
                onClick={() => setSelectedSuggestion(suggestion.id)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-text-secondary">{suggestion.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${suggestion.confidence >= 90 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : suggestion.confidence >= 80
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }
                    `}>
                      {suggestion.confidence}%
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-text-secondary/80 mb-4">
                  💡 {suggestion.reasoning}
                </div>
                
                {selectedSuggestion === suggestion.id && (
                  <button
                    onClick={() => onChartGenerated?.(suggestion)}
                    className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Generate Chart
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Preview */}
      {selectedSuggestionData && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-text-primary">Chart Preview</h3>
          
          {selectedSuggestionData.type === '3d-bar' ? (
            <Chart3D
              type="3d-bar"
              data={selectedSuggestionData.preview}
              title={selectedSuggestionData.title}
              interactive={true}
              height={400}
            />
          ) : (
            <RevolutionaryChart
              type={selectedSuggestionData.type}
              data={selectedSuggestionData.preview}
              title={selectedSuggestionData.title}
              glassmorphism={true}
              interactive={true}
              height={400}
            />
          )}
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-text-primary">AI Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="glass-card p-4 rounded-xl border border-glass-border/40 bg-glass-light/20 animate-slide-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm
                    ${insight.type === 'trend' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                      insight.type === 'anomaly' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                      insight.type === 'correlation' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                      'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                    }
                  `}>
                    {insight.type === 'trend' ? '📈' :
                     insight.type === 'anomaly' ? '⚠️' :
                     insight.type === 'correlation' ? '🔗' : '🔮'
                    }
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-text-primary">{insight.title}</h4>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${insight.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }
                      `}>
                        {insight.impact}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartAIAssistant;