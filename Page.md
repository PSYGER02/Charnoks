# Pages Directory Code Collection

This document contains all the code from each file in the pages folder.

## pages/owner/OwnerDashboard.tsx

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useSupabaseAuth';
import CreateWorkerForm from '../../components/CreateWorkerForm';

const OwnerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [showWorkerForm, setShowWorkerForm] = useState(false);

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Account Dashboard</h1>
                <p className="text-text-secondary mt-1">Manage your account and workers</p>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    to="/owner/home"
                    className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Business Overview</h3>
                    <p className="text-blue-100">View sales, revenue, and performance metrics</p>
                </Link>

                <button
                    onClick={() => setShowWorkerForm(true)}
                    className="block p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="text-3xl mb-2">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Create Worker</h3>
                    <p className="text-green-100">Add new workers to your team</p>
                </button>

                <Link
                    to="/owner/settings"
                    className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="text-3xl mb-2">⚙️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                    <p className="text-purple-100">Configure your account preferences</p>
                </Link>
            </div>

            {/* Account Information */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-text-secondary">Email</span>
                        <span className="text-text-primary">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-text-secondary">Role</span>
                        <span className="text-text-primary capitalize">{user?.role}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-text-secondary">Display Name</span>
                        <span className="text-text-primary">{user?.displayName}</span>
                    </div>
                </div>
            </div>

            {/* Worker Creation Modal */}
            {showWorkerForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Create Worker Account</h2>
                            <button
                                onClick={() => setShowWorkerForm(false)}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                ✕
                            </button>
                        </div>
                        <CreateWorkerForm onSuccess={() => setShowWorkerForm(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
```

## pages/owner/OwnerHomePage.tsx

```tsx
import React from 'react';
import { useState } from 'react';
import KPICard from '../../components/ui/KPI_Card';
import ChartContainer from '../../components/charts/ChartContainer';
import { getOwnerDashboard } from '../../services/supabaseService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import CreateWorkerForm from '../../components/CreateWorkerForm';
import Spinner from '../../components/ui/Spinner';
import { useEnhancedDataLoading } from '../../hooks/useEnhancedDataLoading';

interface CustomizedLabelProps {
    cx: number;
    cy: number;
    midAngle?: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
}

// Default empty data structure for new users
const getEmptyDashboardData = () => ({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactions: 0,
    salesTrend: [
        { name: 'Mon', sales: 0 },
        { name: 'Tue', sales: 0 },
        { name: 'Wed', sales: 0 },
        { name: 'Thu', sales: 0 },
        { name: 'Fri', sales: 0 },
        { name: 'Sat', sales: 0 },
        { name: 'Sun', sales: 0 }
    ],
    topProducts: [
        { name: 'No products yet', value: 1 }
    ]
});

const OwnerHomePage: React.FC = () => {
    const { loadingState, reload, refresh } = useEnhancedDataLoading(
        () => getOwnerDashboard(),
        {
            cacheKey: 'owner-dashboard',
            cacheDuration: 2 * 60 * 1000, // 2 minutes
            autoRefresh: true, // Enable auto-refresh for real-time updates
            maxRetries: 2
        }
    );

    const dashboardData = loadingState.data || getEmptyDashboardData();
    const isLoading = loadingState.loading && !loadingState.data;
    const hasError = loadingState.error && !loadingState.data;

    // Show loading spinner only on initial load
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const { totalRevenue, netProfit, transactions, salesTrend, topProducts } = dashboardData;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
        if (midAngle === undefined) return null;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Dashboard Overview</h1>
                <p className="text-text-secondary mt-1">Monitor your business performance</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Revenue" 
                    value={`$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="💰" 
                />
                <KPICard 
                    title="Net Profit" 
                    value={`$${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="📈" 
                />
                <KPICard 
                    title="Total Transactions" 
                    value={transactions.toString()} 
                    icon="🛍️" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Chart */}
                <ChartContainer title="Sales Trend" className="min-h-[400px]">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart
                            data={salesTrend}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#0088FE" 
                                fillOpacity={1} 
                                fill="url(#salesGradient)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Top Products Chart */}
                <ChartContainer title="Top Products" className="min-h-[400px]">
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={topProducts}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* Getting Started Guide for new users */}
            {totalRevenue === 0 && transactions === 0 && (
                <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-6 animate-bounce-in border border-border/50">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">🎉 Welcome to Your Dashboard!</h2>
                    <p className="text-text-secondary mb-6">Let's get started with setting up your business metrics</p>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">1. Add Your Products</div>
                            <p className="text-blue-300/80">Start by adding your products in the Products page.</p>
                        </div>
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">2. Record Sales</div>
                            <p className="text-blue-300/80">Use the Sales page to record transactions and track your revenue.</p>
                        </div>
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">3. Monitor Growth</div>
                            <p className="text-blue-300/80">Watch your dashboard come alive with real data and insights!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerHomePage;
```
## pages/AdvancedAnalyticsPage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { getSalesAnalytics, getWorkersList, getWorkerPerformance, formatCurrency, formatDate } from '../services/supabaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Spinner from '../components/ui/Spinner';
import ChartContainer from '../components/charts/ChartContainer';

interface AnalyticsData {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  salesByPeriod: { [key: string]: number };
  topProducts: { [key: string]: { name: string; quantity: number; revenue: number } };
  workerPerformance: { [key: string]: { name: string; sales: number; transactions: number } };
}

interface Worker {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const AdvancedAnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [workerPerformance, setWorkerPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchAnalyticsData();
    fetchWorkers();
  }, [dateRange, groupBy]);

  useEffect(() => {
    if (selectedWorker) {
      fetchWorkerPerformance();
    }
  }, [selectedWorker]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await getSalesAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy
      });
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const workersList = await getWorkersList();
      setWorkers(workersList);
      if (workersList.length > 0 && !selectedWorker) {
        setSelectedWorker(workersList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const fetchWorkerPerformance = async () => {
    if (!selectedWorker) return;
    
    try {
      const performance = await getWorkerPerformance(selectedWorker, 30);
      setWorkerPerformance(performance);
    } catch (err: any) {
      console.error('Failed to fetch worker performance:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 text-red-300 text-center p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center text-text-secondary p-4">
        No analytics data available
      </div>
    );
  }

  // Prepare chart data
  const salesTrendData = Object.entries(analyticsData.salesByPeriod).map(([period, sales]) => ({
    period,
    sales: parseFloat(sales.toFixed(2))
  })).sort((a, b) => a.period.localeCompare(b.period));

  const topProductsData = Object.values(analyticsData.topProducts)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(product => ({
      name: product.name,
      revenue: parseFloat(product.revenue.toFixed(2)),
      quantity: product.quantity
    }));

  const workerPerformanceData = Object.values(analyticsData.workerPerformance)
    .sort((a, b) => b.sales - a.sales)
    .map(worker => ({
      name: worker.name,
      sales: parseFloat(worker.sales.toFixed(2)),
      transactions: worker.transactions
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-8">
      <header className="animate-bounce-in">
        <h1 className="text-4xl font-bold text-text-primary">Advanced Analytics</h1>
        <p className="text-text-secondary mt-1">Deep insights into your business performance</p>
      </header>

      {/* Controls */}
      <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-full bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Worker</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition"
            >
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h3 className="text-lg font-semibold text-text-secondary mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-primary">{formatCurrency(analyticsData.totalSales)}</p>
        </div>
        <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h3 className="text-lg font-semibold text-text-secondary mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-primary">{analyticsData.totalTransactions.toLocaleString()}</p>
        </div>
        <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
          <h3 className="text-lg font-semibold text-text-secondary mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-primary">{formatCurrency(analyticsData.averageOrderValue)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <ChartContainer title={`Sales Trend (${groupBy})`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="period" tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} />
              <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
              <Line type="monotone" dataKey="sales" stroke="rgb(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Products */}
        <ChartContainer title="Top Products by Revenue">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} />
              <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
              <Bar dataKey="revenue" fill="rgb(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Worker Performance */}
        <ChartContainer title="Worker Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workerPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} />
              <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
              <Bar dataKey="sales" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Selected Worker Details */}
        {workerPerformance && (
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
            <h3 className="text-xl font-bold text-text-primary mb-4">{workerPerformance.workerName} Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Sales:</span>
                <span className="font-bold text-primary">{formatCurrency(workerPerformance.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Expenses:</span>
                <span className="font-bold text-red-400">{formatCurrency(workerPerformance.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Net Profit:</span>
                <span className="font-bold text-green-400">{formatCurrency(workerPerformance.netProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Transactions:</span>
                <span className="font-bold text-text-primary">{workerPerformance.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Period:</span>
                <span className="font-bold text-text-primary">{workerPerformance.period}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
```
## pages/AIAssistantPage.tsx

```tsx
import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from '../components/ai/ChatBubble';
import ChatInput from '../components/ai/ChatInput';
import PromptSuggestions from '../components/ai/PromptSuggestions';
import { getAIAssistantResponse } from '../services/supabaseService';

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
            const responseText = await getAIAssistantResponse(query, historyForAI);
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
```

## pages/AnalysisPage.tsx

```tsx

import React, { useState } from 'react';

// New analysis mode components
import AnalysisHome from '../components/analysis/AnalysisHome';
import AllWorkersOverview from '../components/analysis/AllWorkersOverview';
import CompareWorkers from '../components/analysis/CompareWorkers';
import WorkerInsight from '../components/analysis/WorkerInsight';
import AIPrediction from '../components/analysis/AIPrediction';

// Services
import { getSales, getExpenses, getWorkersList } from '../services/supabaseService';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import Spinner from '../components/ui/Spinner';

export type AnalysisMode = 'home' | 'all-workers' | 'compare-workers' | 'worker-insight' | 'ai-prediction';

const AnalysisPage: React.FC = () => {
    const [mode, setMode] = useState<AnalysisMode>('home');

    // Load data with enhanced error handling
    const { loadingState: salesState } = useEnhancedDataLoading(
        () => getSales(100),
        {
            cacheKey: 'analysis-sales',
            cacheDuration: 5 * 60 * 1000, // 5 minutes
            maxRetries: 2
        }
    );

    const { loadingState: expensesState } = useEnhancedDataLoading(
        () => getExpenses(100),
        {
            cacheKey: 'analysis-expenses',
            cacheDuration: 5 * 60 * 1000,
            maxRetries: 2
        }
    );

    const { loadingState: workersState } = useEnhancedDataLoading(
        () => getWorkersList(),
        {
            cacheKey: 'analysis-workers',
            cacheDuration: 10 * 60 * 1000, // 10 minutes
            maxRetries: 2
        }
    );

    // Get data or use empty arrays
    const sales = salesState.data || [];
    const expenses = expensesState.data || [];
    const workers = workersState.data || [];
    const products = []; // Will be loaded separately if needed

    const isLoading = (salesState.loading && !salesState.data) || 
                     (expensesState.loading && !expensesState.data) || 
                     (workersState.loading && !workersState.data);

    const hasError = (salesState.error && !salesState.data) || 
                    (expensesState.error && !expensesState.data) || 
                    (workersState.error && !workersState.data);

    const renderContent = () => {
        if (isLoading && mode !== 'home') {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            );
        }

        switch (mode) {
            case 'all-workers':
                return <AllWorkersOverview sales={sales} expenses={expenses} hasError={hasError} />;
            case 'compare-workers':
                return <CompareWorkers sales={sales} expenses={expenses} workers={workers} hasError={hasError} />;
            case 'worker-insight':
                return <WorkerInsight sales={sales} expenses={expenses} workers={workers} products={products} hasError={hasError} />;
            case 'ai-prediction':
                return <AIPrediction sales={sales} hasError={hasError} />;
            case 'home':
            default:
                return <AnalysisHome setMode={setMode} />;
        }
    };

    const getPageTitle = () => {
        switch (mode) {
            case 'all-workers': return "All Workers Overview";
            case 'compare-workers': return "Compare Workers";
            case 'worker-insight': return "Worker Insight";
            case 'ai-prediction': return "AI-Powered Predictions";
            case 'home':
            default:
                return "Analysis Center";
        }
    };

    return (
        <div className="space-y-6">
            {/* Error banner for data loading issues (non-blocking) */}
            {hasError && mode !== 'home' && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="text-yellow-400 mr-3">⚠️</span>
                        <div>
                            <h3 className="text-yellow-300 font-medium">Limited data available</h3>
                            <p className="text-yellow-400/80 text-sm">
                                Some data couldn't be loaded. Analysis will show available information only.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header className="animate-bounce-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">{getPageTitle()}</h1>
                        <p className="text-text-secondary mt-1">
                            {mode === 'home' ? 'Select an analysis mode to begin.' : 
                             sales.length === 0 && expenses.length === 0 ? 'Start recording sales and expenses to see analysis.' :
                             'Dive deep into your business data.'}
                        </p>
                    </div>
                    {mode !== 'home' && (
                        <button
                            onClick={() => setMode('home')}
                            className="bg-white/10 hover:bg-white/20 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Modes
                        </button>
                    )}
                </div>
            </header>
            
            <div className="animate-slide-in-bottom">
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalysisPage;
```
## pages/ExpensesPage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import type { Expense } from '../types';
import { useAuth } from '../hooks/useSupabaseAuth';
import Spinner from '../components/ui/Spinner';
import { getExpenses, recordExpense } from '../services/supabaseService';

const ExpenseRow: React.FC<{ expense: Expense }> = ({ expense }) => {
    return (
        <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
            <td className="p-3 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
            <td className="p-3">{expense.description}</td>
            <td className="p-3 whitespace-nowrap">{expense.workerName || 'Unknown'}</td>
            <td className="p-3 text-right font-semibold text-red-400 whitespace-nowrap">{`$${expense.amount.toFixed(2)}`}</td>
        </tr>
    );
};

const ExpensesPage: React.FC = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const fetchedExpenses = await getExpenses();
                setExpenses(fetchedExpenses);
            } catch (err) {
                setError('Failed to load expenses.');
                console.error(err);
            } finally {
                setLoadingExpenses(false);
            }
        };
        fetchExpenses();
    }, []);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || parseFloat(amount) <= 0) {
            setError('Please fill out all fields with valid values.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await recordExpense({
                description,
                amount: parseFloat(amount)
            });

            // Refresh expenses list
            const updatedExpenses = await getExpenses();
            setExpenses(updatedExpenses);
            
            setDescription('');
            setAmount('');
        } catch (err) {
            setError('Failed to add expense. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingExpenses) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Expenses</h1>
            
            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="mb-8 bg-white/5 p-4 rounded-lg">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div className="w-48">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount"
                            step="0.01"
                            min="0"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary hover:bg-primary/80 rounded text-white disabled:opacity-50"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Add Expense'}
                    </button>
                </div>
                {error && <p className="mt-2 text-red-400">{error}</p>}
            </form>

            {/* Expenses Table */}
            <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/10">
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Description</th>
                            <th className="p-3 text-left">Worker</th>
                            <th className="p-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-3 text-center text-gray-400">
                                    No expenses recorded yet.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <ExpenseRow key={expense.id} expense={expense} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpensesPage;
```

## pages/LoginPage.tsx

```tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useSupabaseAuth';
import { InlineLoader } from '../components/ui/LoadingScreen';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z" clipRule="evenodd" />
        <path d="M2 10s3.939-7 8-7 8 7 8 7-3.939 7-8 7-8-7-8-7zm7.939 2.553a2.5 2.5 0 01-3.498-3.498l3.498 3.498z" />
    </svg>
);

const LogoIcon = () => (
    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl p-2">
        <img 
            src="/Charnoks logo-192x192.png" 
            alt="Charnoks Logo" 
            className="w-20 h-20 object-contain drop-shadow-lg" 
        />
    </div>
);

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);


    const from = (location.state as any)?.from?.pathname || "/";

    // Auto-redirect if already authenticated
    React.useEffect(() => {
        if (auth.isAuthenticated && auth.user) {
            const redirectPath = auth.user.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [auth.isAuthenticated, auth.user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            const userData = await auth.login(email, password);
            // Redirect based on user role
            const redirectPath = userData.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
            setIsLoggingIn(false);
        }
    };
    

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4 animate-bounce-in" style={{animationDelay: '100ms'}}>
                    <div className="flex justify-center">
                        <LogoIcon />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-center gap-3 animate-bounce-in" style={{animationDelay: '150ms'}}>
                            <img 
                                src="/Charnoks logo-192x192.png" 
                                alt="Charnoks" 
                                className="w-12 h-12 object-contain drop-shadow-lg" 
                            />
                            <h1 className="text-5xl font-bold brand-title">
                                CHARNOKS
                            </h1>
                        </div>
                        <p className="text-lg brand-subtitle mt-2 animate-bounce-in" style={{animationDelay: '200ms'}}>
                            Point of Sale System
                        </p>
                        <p className="text-sm text-white/70 mt-1 animate-bounce-in" style={{animationDelay: '250ms'}}>
                            🍗 Special Fried Chicken & More
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-center text-white animate-bounce-in" style={{animationDelay: '300ms'}}>✨ Welcome Back</h2>
                <p className="text-center text-white/80 animate-bounce-in" style={{animationDelay: '350ms'}}>Sign in to manage your Charnoks restaurant</p>

                <form className="space-y-5 animate-bounce-in" style={{animationDelay: '400ms'}} onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">Username or Email address</label>
                         <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                            <span className="px-3 text-white/70"><UserIcon /></span>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full bg-transparent py-2.5 pr-3 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Username or Email address"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                             <span className="px-3 text-white/70"><LockIcon /></span>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full bg-transparent py-2.5 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-white/70 focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-300 text-sm text-center bg-red-500/20 p-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded bg-white/30 border-border/50 text-primary focus:ring-primary" />
                            <label htmlFor="remember-me" className="text-white/80">Remember Me</label>
                        </div>
                        <a href="#" className="font-medium text-white/80 hover:text-white">Forgot password?</a>
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full flex justify-center py-3 px-4 text-base font-bold rounded-lg text-text-on-primary bg-card-bg-solid shadow-lg shadow-black/20 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-50"
                        >
                            {isLoggingIn ? (
                                <div className="flex items-center space-x-2">
                                    <InlineLoader message="" size="sm" />
                                    <span>Signing in...</span>
                                </div>
                            ) : 'Login'}
                        </button>
                    </div>
                </form>



                <p className="text-center text-sm text-white/60 animate-bounce-in" style={{animationDelay: '600ms'}}>
                    Don't have an account? <Link to="/signup" className="font-medium text-white/80 hover:text-white">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
```
## pages/NotesPage.tsx

```tsx
import React, { useState, useMemo } from 'react';
import type { Note } from '../types';
import Spinner from '../components/ui/Spinner';
import { getNotes } from '../services/supabaseService';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';

type NoteCategory = Note['category'] | 'All';

const NotesPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load notes data
    const { loadingState: notesState, refresh: refreshNotes } = useEnhancedDataLoading(
        () => getNotes(100),
        {
            cacheKey: 'internal-notes',
            cacheDuration: 5 * 60 * 1000,
            maxRetries: 2
        }
    );

    const notes = notesState.data || [];
    const isLoading = notesState.loading && !notesState.data;
    const hasError = notesState.error && !notesState.data;
    
    // Form state
    const [category, setCategory] = useState<Note['category']>('Other');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    // Filter state
    const [categoryFilter, setCategoryFilter] = useState<NoteCategory>('All');

    const showAmountField = useMemo(() => category === 'Supply Cost' || category === 'Internal Expense', [category]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // For now, this will show a message that the feature needs backend implementation
            alert('Note saving feature requires backend implementation. The form works but data won\'t persist yet.');
            
            // Reset form
            setTitle('');
            setDescription('');
            setAmount('');
            setCategory('Other');
            
            // Refresh notes (will still be empty until backend is implemented)
            refreshNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Error saving note. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            if (categoryFilter === 'All') return true;
            return note.category === categoryFilter;
        });
    }, [notes, categoryFilter]);
    
    const noteCategories: Note['category'][] = ['Delivery Note', 'Reminder', 'Supply Cost', 'Internal Expense', 'Other'];

    return (
        <div className="space-y-8">
            {/* Error banner for data loading issues (non-blocking) */}
            {hasError && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-yellow-400 mr-3">⚠️</span>
                            <div>
                                <h3 className="text-yellow-300 font-medium">Unable to load notes</h3>
                                <p className="text-yellow-400/80 text-sm">
                                    You can still add notes, but they may not persist without proper backend setup.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={refreshNotes}
                            className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Internal Log</h1>
                <p className="text-text-secondary mt-1">
                    {notes.length === 0 ? 
                        'Record internal notes, memos, and expenses for your business.' :
                        'Manage your internal notes, memos, and expenses.'
                    }
                </p>
            </header>

            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Add New Note</h2>
                <form onSubmit={handleAddNote} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                             <select value={category} onChange={e => setCategory(e.target.value as Note['category'])} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary">
                                {noteCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Note Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition"></textarea>
                    </div>
                    {showAmountField && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Amount ($)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80 disabled:opacity-50 flex items-center justify-center">
                             {isSubmitting && <Spinner size="sm" />}
                            <span className={isSubmitting ? 'ml-2' : ''}>Save Note</span>
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Recent Notes ({filteredNotes.length})</h2>
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-text-secondary">Filter by Category:</label>
                         <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as NoteCategory)} className="bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition text-text-primary">
                            <option value="All">All Categories</option>
                            {noteCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="overflow-auto max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-primary text-2xl">📝</span>
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                {notes.length === 0 ? 'No Notes Yet' : 'No notes found for selected category'}
                            </h3>
                            <p className="text-text-secondary mb-4">
                                {notes.length === 0 ? 
                                    'Start recording internal notes, memos, and expenses using the form above.' :
                                    'Try selecting a different category to see more notes.'
                                }
                            </p>
                            {notes.length === 0 && (
                                <button
                                    onClick={() => {
                                        const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                        if (titleInput) titleInput.focus();
                                    }}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Add First Note
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left table-auto">
                            <thead className="sticky top-0 bg-card-bg-solid/80 backdrop-blur-sm">
                                <tr>
                                    <th className="p-3 font-semibold text-text-secondary">Date</th>
                                    <th className="p-3 font-semibold text-text-secondary">Category</th>
                                    <th className="p-3 font-semibold text-text-secondary">Title</th>
                                    <th className="p-3 font-semibold text-text-secondary text-right">Amount</th>
                                    <th className="p-3 font-semibold text-text-secondary text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotes.map(note => (
                                    <tr key={note.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                        <td className="p-3 whitespace-nowrap">{new Date(note.date).toLocaleDateString()}</td>
                                        <td className="p-3 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary rounded-full">{note.category}</span>
                                        </td>
                                        <td className="p-3 font-medium text-text-primary">{note.title}</td>
                                        <td className="p-3 text-right font-semibold text-accent whitespace-nowrap">
                                            {note.amount ? `$${note.amount.toFixed(2)}` : 'N/A'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button className="text-sm text-text-secondary hover:text-text-primary">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesPage;
```

## pages/Ownersdashboard.tsx

```tsx
import React from 'react';
import { useState } from 'react';
import KPICard from '../components/ui/KPI_Card';
import ChartContainer from '../components/charts/ChartContainer';
import { getOwnerDashboard } from '../services/supabaseService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import CreateWorkerForm from '../components/CreateWorkerForm';
import Spinner from '../components/ui/Spinner';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';

interface CustomizedLabelProps {
    cx: number;
    cy: number;
    midAngle?: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
}

// Default empty data structure for new users
const getEmptyDashboardData = () => ({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactions: 0,
    salesTrend: [
        { name: 'Mon', sales: 0 },
        { name: 'Tue', sales: 0 },
        { name: 'Wed', sales: 0 },
        { name: 'Thu', sales: 0 },
        { name: 'Fri', sales: 0 },
        { name: 'Sat', sales: 0 },
        { name: 'Sun', sales: 0 }
    ],
    topProducts: [
        { name: 'No products yet', value: 1 }
    ]
});

const Ownersdashboard: React.FC = () => {
    const [showWorkerForm, setShowWorkerForm] = useState(false);

    const { loadingState, reload, refresh } = useEnhancedDataLoading(
        () => getOwnerDashboard(),
        {
            cacheKey: 'owner-dashboard',
            cacheDuration: 2 * 60 * 1000, // 2 minutes
            autoRefresh: false, // Don't auto-refresh for new users
            maxRetries: 2, // Reduce retries to fail faster
            onError: (error) => {
                console.error('Dashboard loading error:', error);
                // For new users, we'll show empty data instead of errors
            }
        }
    );

    // Get dashboard data or use empty data for new users
    const dashboardData = loadingState.data || getEmptyDashboardData();
    const isLoading = loadingState.loading && !loadingState.data;
    const hasError = loadingState.error && !loadingState.data;

    // Show loading spinner only on initial load
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const { totalRevenue, netProfit, transactions, salesTrend, topProducts } = dashboardData;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
        if (midAngle === undefined) return null;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.07) return null; // Don't render label for small slices

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-xs pointer-events-none">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-8">

            <header className="animate-bounce-in flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary mt-1">
                        {totalRevenue === 0 ? 'Welcome! Start by adding products and making sales.' : 'Welcome back, Owner!'}
                    </p>
                </div>
                <button
                    onClick={() => setShowWorkerForm(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    + Create Worker Account
                </button>
            </header>

            {/* Worker Creation Modal */}
            {showWorkerForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Create Worker Account</h2>
                            <button
                                onClick={() => setShowWorkerForm(false)}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                ✕
                            </button>
                        </div>
                        <CreateWorkerForm />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Revenue" 
                    value={`$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="💰" 
                    trend={totalRevenue > 0 ? "+5.2% this month" : "Start making sales to see trends"} 
                    trendDirection={totalRevenue > 0 ? "up" : undefined} 
                />
                <KPICard 
                    title="Net Profit" 
                    value={`$${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="📈" 
                    trend={netProfit > 0 ? "+3.1% this month" : "Add expenses to track profit"} 
                    trendDirection={netProfit > 0 ? "up" : undefined} 
                />
                <KPICard 
                    title="Transactions" 
                    value={transactions.toLocaleString()} 
                    icon="🛒" 
                    trend={transactions > 0 ? "Active sales" : "No transactions yet"} 
                    trendDirection={transactions > 0 ? "up" : undefined} 
                />
                <KPICard 
                    title="Top Product" 
                    value={totalRevenue > 0 ? (topProducts[0]?.name || 'No sales yet') : 'Add products first'} 
                    icon="🔥" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <ChartContainer title="Sales Trend (Last 7 Days)">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="rgba(var(--primary), 0.8)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="rgba(var(--primary), 0.1)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} />
                                <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} tickFormatter={(value: any) => `$${value}`} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(30,41,59,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.2)', 
                                        borderRadius: '0.5rem' 
                                    }} 
                                    formatter={(value: any) => [`$${value}`, 'Sales']}
                                />
                                <Area type="monotone" dataKey="sales" stroke="rgb(var(--primary))" fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
                <div className="lg:col-span-2">
                    <ChartContainer title="Top 5 Products by Revenue">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topProducts}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={totalRevenue > 0 ? renderCustomizedLabel : undefined}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {topProducts.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(30,41,59,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.2)', 
                                        borderRadius: '0.5rem' 
                                    }} 
                                />
                                <Legend 
                                    iconSize={10} 
                                    wrapperStyle={{
                                        fontSize: '12px', 
                                        color: 'rgb(var(--text-secondary))', 
                                        paddingBottom: '20px' 
                                    }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>

            {/* Getting Started Guide for New Users */}
            {totalRevenue === 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-blue-300 font-semibold mb-3">🚀 Getting Started</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">1. Add Products</div>
                            <p className="text-blue-300/80">Go to Products page and add your inventory items with prices and images.</p>
                        </div>
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">2. Record Sales</div>
                            <p className="text-blue-300/80">Use the Sales page to record transactions and track your revenue.</p>
                        </div>
                        <div className="bg-blue-800/20 rounded-lg p-4">
                            <div className="text-blue-200 font-medium mb-2">3. Monitor Growth</div>
                            <p className="text-blue-300/80">Watch your dashboard come alive with real data and insights!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ownersdashboard;
```
## pages/ProductsPage.tsx

```tsx
import React, { useState, useCallback } from 'react';
import { getProducts, addProduct, uploadProductImage } from '../services/supabaseService';
import type { Product } from '../types';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import { DataLoadingWrapper } from '../components/ui/LoadingWrapper';
import { InlineLoader } from '../components/ui/LoadingScreen';

const ProductForm: React.FC<{ onProductAdd: (product: Product) => void }> = ({ onProductAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [category, setCategory] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        } else {
            setError('Please select a valid image file.');
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };
    
    const resetForm = useCallback(() => {
        setName('');
        setPrice('');
        setQuantity('0');
        setCategory('');
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!name || !price || !quantity || !imageFile) {
            setError('Please fill all required fields and upload an image.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload image to Supabase Storage
            const imageUrl = await uploadProductImage(imageFile);

            // 2. Call addProduct service function
            const productId = await addProduct({
                name,
                price: parseFloat(price),
                stock: parseInt(quantity, 10),
                category,
                imageUrl,
            });

            setSuccess(`Product "${name}" added successfully!`);
            
            // Refresh the product list
            const products = await getProducts();
            const newProduct = products.find(p => p.id === productId);
            if (newProduct) {
                onProductAdd(newProduct);
            }
            resetForm();
        } catch (err) {
            setError('Failed to add product. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSuccess(null), 4000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-text-secondary mb-1">Product Name</label>
                        <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-text-secondary mb-1">Price</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                            <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category (Optional)</label>
                        <input type="text" id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                     <label 
                        htmlFor="image-upload" 
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/70'}`}
                     >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Product Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                             <div className="text-center text-text-secondary p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <p className="mt-2 font-semibold">Click to upload or drag & drop</p>
                                <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                    </label>
                </div>
            </div>
            
            {error && <div className="text-red-400 text-center p-2 bg-red-500/10 rounded-lg">{error}</div>}
            {success && <div className="text-green-400 text-center p-2 bg-green-500/10 rounded-lg">{success}</div>}

            <div className="flex justify-end space-x-4">
                <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg bg-white/10 text-text-primary font-semibold transition hover:bg-white/20">Reset</button>
                <button type="submit" disabled={isLoading} className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80 disabled:opacity-50 flex items-center">
                    {isLoading && <InlineLoader message="" size="sm" />}
                    <span className={isLoading ? 'ml-2' : ''}>
                        {isLoading ? 'Saving...' : 'Save Product'}
                    </span>
                </button>
            </div>
        </form>
    );
};

const ProductsPage: React.FC = () => {
    const { loadingState, reload, refresh } = useEnhancedDataLoading(
        () => getProducts(),
        {
            cacheKey: 'products-list',
            cacheDuration: 3 * 60 * 1000, // 3 minutes
            autoRefresh: false, // Manual refresh for products
            maxRetries: 2, // Reduce retries to fail faster
            onError: (error) => {
                console.error('Products loading error:', error);
            }
        }
    );

    const handleProductAdd = () => {
        refresh(); // Refresh to get the latest data from server
    };

    // Get products data or use empty array for new users
    const products = loadingState.data || [];
    const isLoading = loadingState.loading && !loadingState.data;
    const hasError = loadingState.error && !loadingState.data;

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Product Management</h1>
                <p className="text-text-secondary mt-1">Add new items to your inventory and view existing stock.</p>
            </header>
            
            {/* Error banner for configuration issues (non-blocking) */}
            {hasError && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-yellow-400 mr-3">⚠️</span>
                            <div>
                                <h3 className="text-yellow-300 font-medium">Unable to load products</h3>
                                <p className="text-yellow-400/80 text-sm">
                                    You can still add products. Configure your system to sync data.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={reload}
                            className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}
            
            <ProductForm onProductAdd={handleProductAdd} />
            
            {/* Products List */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Current Products ({products.length})</h2>
                    {!isLoading && (
                        <button
                            onClick={refresh}
                            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>
                
                <DataLoadingWrapper
                    loading={isLoading}
                    error={hasError ? 'Unable to load products' : null}
                    data={products}
                    emptyMessage="No Products Yet"
                    emptyIcon="📦"
                    onRetry={reload}
                    skeletonLines={4}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {products.map(product => (
                            <div key={product.id} className="bg-card-bg-solid/50 rounded-xl p-4 border border-border/30 flex flex-col justify-between transition-all hover:shadow-lg hover:border-primary/50 hover:scale-105">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                                <div>
                                    <p className="font-bold text-text-primary truncate">{product.name}</p>
                                    <p className="text-sm text-text-secondary capitalize">{product.category || 'Uncategorized'}</p>
                                </div>
                                <div className="flex justify-between items-end mt-3">
                                    <p className="font-bold text-xl text-primary">${product.price.toFixed(2)}</p>
                                    <p className="text-sm text-text-secondary font-medium">Stock: {product.stock}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DataLoadingWrapper>
            </div>
        </div>
    );
};

export default ProductsPage;
```
## pages/SalesPage.tsx

```tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { ParsedSale } from '../types';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { subscribeToProducts, recordSale } from '../services/supabaseService';
import { parseSaleFromVoice } from '../services/supabaseService';
import type { Product } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

const NumberPad: React.FC<{
  onInput: (value: string) => void;
  onDone: () => void;
}> = ({ onInput, onDone }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onInput(key)}
          className="bg-white/10 text-text-primary rounded-lg text-2xl font-bold h-16 flex items-center justify-center transition-all duration-200 active:bg-primary active:scale-105"
        >
          {key}
        </button>
      ))}
      <button
        onClick={onDone}
        className="col-span-3 bg-primary text-text-on-primary rounded-lg text-xl font-bold h-16 flex items-center justify-center transition-colors hover:bg-primary/80"
      >
        Done
      </button>
    </div>
  );
};

const SuccessOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-bounce-in">
        <div className="bg-green-500 rounded-full w-32 h-32 flex items-center justify-center shadow-2xl">
            <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    </div>
);

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [moneyReceived, setMoneyReceived] = useState('');
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [editingField, setEditingField] = useState<'money' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Voice input state
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [parsedSale, setParsedSale] = useState<ParsedSale | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToProducts((fetchedProducts) => {
        setProducts(fetchedProducts);
        setLoadingProducts(false);
      });
      
      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (err) {
      setError('Failed to load products.');
      setLoadingProducts(false);
    }
  }, []);

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
  const change = useMemo(() => {
    const received = parseFloat(moneyReceived);
    return received > 0 && received >= total ? received - total : 0;
  }, [moneyReceived, total]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(currentCart => {
        if (newQuantity <= 0) {
            return currentCart.filter(item => item.product.id !== productId);
        }
        return currentCart.map(item => 
            item.product.id === productId ? { ...item, quantity: newQuantity } : item
        );
    });
  };

  const openNumberPad = (field: 'money') => {
    setEditingField(field);
    setShowNumberPad(true);
  };
  
  const handleNumberPadInput = (value: string) => {
    if (editingField === 'money') {
        setMoneyReceived(prev => {
            if (value === '⌫') {
                return prev.slice(0, -1);
            }
            if (value === '.' && prev.includes('.')) {
                return prev;
            }
            return prev + value;
        });
    }
  };

  const handleSaveSale = useCallback(async () => {
    if(cart.length === 0) return;
    try {
      const saleId = await recordSale({
        items: cart.map(item => ({ 
          productId: item.product.id, 
          quantity: item.quantity 
        })),
        payment: parseFloat(moneyReceived)
      });
      
      if (saleId) {
        setShowSuccess(true);
        setTimeout(() => {
          setCart([]);
          setMoneyReceived('');
          setShowSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save sale.');
    }
  }, [cart, moneyReceived]);

  const handleTranscript = async (transcript: string) => {
    setIsProcessingVoice(true);
    setVoiceError(null);
    try {
      const result = await parseSaleFromVoice(transcript);
      const saleItems: CartItem[] = [];
      let saleTotal = 0;
      result.items.forEach((item: any) => {
        const product = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
        if (product) {
          saleItems.push({ product, quantity: item.quantity });
          saleTotal += product.price * item.quantity;
        }
      });
      setParsedSale({
        items: saleItems,
        payment: saleTotal,
        total: saleTotal,
      });
      setShowConfirmationModal(true);
    } catch (e: any) {
      setVoiceError(e.message || "Couldn't understand. Try again.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleConfirmSaleFromVoice = () => {
    if (!parsedSale) return;
    setCart(parsedSale.items);
    setMoneyReceived(String(parsedSale.payment));
    setShowConfirmationModal(false);
    setParsedSale(null);
  };

  if (loadingProducts) {
    return <div className="flex justify-center items-center h-64"><span>Loading products...</span></div>;
  }
  if (error) {
    return <div className="bg-red-900/20 text-red-300 text-center p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="h-full max-h-[calc(100vh-100px)] lg:max-h-screen lg:h-screen lg:overflow-hidden p-0 -m-4 sm:-m-6 lg:-m-8">
      <ConfirmationModal 
        isOpen={showConfirmationModal}
        parsedSale={parsedSale}
        onConfirm={handleConfirmSaleFromVoice}
        onEdit={handleConfirmSaleFromVoice} // Same as confirm, populates the form
        onCancel={() => {
            setShowConfirmationModal(false);
            setParsedSale(null);
        }}
      />
      <div className="flex flex-col lg:flex-row h-full">
        {/* Product Grid */}
        <div className="lg:w-3/5 xl:w-2/3 p-4 space-y-4 overflow-y-auto">
           <header>
             <div>
                <h1 className="text-3xl font-bold text-text-primary">Record Sale</h1>
                <p className="text-text-secondary">Tap products to add to cart or use voice input.</p>
             </div>
           </header>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <button key={product.id} onClick={() => addToCart(product)} className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-3 text-left border border-border/50 transition-all duration-200 hover:border-primary hover:scale-105 active:scale-100">
                <img src={product.imageUrl} alt={product.name} className="w-full h-24 md:h-32 object-cover rounded-lg" />
                <h3 className="font-bold mt-2 text-text-primary truncate">{product.name}</h3>
                <p className="text-primary font-semibold">{`$${product.price.toFixed(2)}`}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart & Payment */}
        <div className="lg:w-2/5 xl:w-1/3 bg-black/20 backdrop-blur-md flex flex-col p-4 relative">
          {showSuccess && <SuccessOverlay />}
          <h2 className="text-2xl font-bold text-text-primary mb-4">Current Sale</h2>
          
          {/* Voice Input */}
          <div className="mb-4">
            <VoiceInputButton 
                onTranscript={handleTranscript}
                isProcessing={isProcessingVoice}
                error={voiceError}
                onResetError={() => setVoiceError(null)}
            />
          </div>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto pr-2 space-y-2">
            {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-secondary">
                    <p>Cart is empty</p>
                </div>
            ) : (
                cart.map(item => (
                <div key={item.product.id} className="flex items-center bg-white/5 p-2 rounded-lg gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 rounded-md object-cover" />
                    <div className="flex-grow">
                        <p className="font-semibold text-text-primary">{item.product.name}</p>
                        <p className="text-sm text-text-secondary">{`$${item.product.price.toFixed(2)}`}</p>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-md">
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="px-3 py-1 text-text-primary font-bold text-lg transition-colors hover:bg-white/20 rounded-l-md">-</button>
                      <span className="px-2 text-text-primary w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="px-3 py-1 text-text-primary font-bold text-lg transition-colors hover:bg-white/20 rounded-r-md">+</button>
                    </div>
                    <p className="font-bold text-text-primary w-20 text-right">{`$${(item.product.price * item.quantity).toFixed(2)}`}</p>
                </div>
                ))
            )}
          </div>
          {/* Payment Section */}
          <div className="border-t border-border mt-4 pt-4 space-y-3">
            <div className="flex justify-between text-xl font-bold">
              <span className="text-text-secondary">Total</span>
              <span className="text-primary">{`$${total.toFixed(2)}`}</span>
            </div>
             <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-text-secondary">Received</span>
                 <button onClick={() => openNumberPad('money')} className="bg-white/10 px-4 py-2 rounded-md text-accent text-2xl">
                    {`$${moneyReceived || '0.00'}`}
                 </button>
             </div>
             <div className="flex justify-between text-2xl font-bold">
                <span className="text-text-secondary">Change</span>
                <span className="text-green-400">{`$${change.toFixed(2)}`}</span>
             </div>
            <button
                onClick={handleSaveSale}
                disabled={cart.length === 0 || parseFloat(moneyReceived) < total}
                className="w-full bg-primary text-text-on-primary text-xl font-bold py-4 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:bg-gray-500"
            >
              Save Sale
            </button>
          </div>
        </div>

        {/* Number Pad Modal */}
        {showNumberPad && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center lg:items-end lg:justify-end">
                <div className="w-full max-w-sm bg-card-bg-solid rounded-t-2xl lg:rounded-2xl lg:m-4 animate-slide-in-bottom">
                   <NumberPad onInput={handleNumberPadInput} onDone={() => setShowNumberPad(false)} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
```
## pages/SettingsPage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import ThemeSelector from '../components/ui/ThemeSelector';
import { useAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../src/supabaseConfig';
import Spinner from '../components/ui/Spinner';

const CreateWorkerForm: React.FC = () => {
  const { createWorkerAccount } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      await createWorkerAccount(name, email, password);
      setSuccess(`Worker account for ${name} created successfully!`);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to create worker account.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg mt-8 animate-slide-in-bottom">
      <h3 className="text-xl font-bold mb-4 text-text-primary">Create Worker Account</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="worker-name" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input type="text" id="worker-name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
          </div>
          <div>
            <label htmlFor="worker-email" className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input type="email" id="worker-email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
          </div>
        </div>
        <div>
          <label htmlFor="worker-password" className="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
          <input type="password" id="worker-password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
        </div>

        {error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</div>}
        {success && <div className="text-green-400 text-sm bg-green-500/10 p-2 rounded-lg">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80 disabled:opacity-50 flex items-center justify-center">
            {isLoading && <Spinner size="sm" />}
            <span className={isLoading ? 'ml-2' : ''}>Create Account</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface Worker {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  created_by: string | null;
}

const UserManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, created_at, is_active, created_by')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToOwner = async (workerId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to promote ${workerName} to Owner? This will give them full administrative access.`)) {
      return;
    }

    setPromotingUser(workerId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'owner' })
        .eq('id', workerId);

      if (error) throw error;
      await fetchWorkers(); // Refresh the list
      alert(`${workerName} has been promoted to Owner successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to promote user');
    } finally {
      setPromotingUser(null);
    }
  };

  const handleToggleStatus = async (workerId: string, currentStatus: boolean, workerName: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} ${workerName}'s account?`)) {
      return;
    }

    setTogglingStatus(workerId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', workerId);

      if (error) throw error;
      await fetchWorkers(); // Refresh the list
      alert(`${workerName}'s account has been ${action}d successfully!`);
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`);
    } finally {
      setTogglingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
        <div className="flex justify-center items-center h-32">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-text-primary">User Management</h3>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {workers.length === 0 ? (
        <p className="text-text-secondary text-center py-8">No workers found. Create some worker accounts to manage them here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Name</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Email</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Status</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Created</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-border/30 hover:bg-white/5">
                  <td className="py-3 px-2 text-text-primary font-medium">{worker.display_name}</td>
                  <td className="py-3 px-2 text-text-secondary">{worker.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      worker.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{formatDate(worker.created_at)}</td>
                  <td className="py-3 px-2 space-x-2">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active, worker.display_name)}
                      disabled={togglingStatus === worker.id}
                      className={`px-3 py-1 text-sm rounded-lg transition disabled:opacity-50 flex items-center ${
                        worker.is_active
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {togglingStatus === worker.id && <Spinner size="sm" />}
                      <span className={togglingStatus === worker.id ? 'ml-2' : ''}>
                        {worker.is_active ? 'Deactivate' : 'Activate'}
                      </span>
                    </button>
                    <button
                      onClick={() => handlePromoteToOwner(worker.id, worker.display_name)}
                      disabled={promotingUser === worker.id}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center"
                    >
                      {promotingUser === worker.id && <Spinner size="sm" />}
                      <span className={promotingUser === worker.id ? 'ml-2' : ''}>
                        Promote to Owner
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BackupSection: React.FC = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupStatus(null);

    try {
      // Get all data for backup
      const [
        { data: products },
        { data: sales },
        { data: expenses },
        { data: notes },
        { data: userProfiles }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('user_profiles').select('*')
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        products,
        sales,
        expenses,
        notes,
        userProfiles
      };

      // Create and download the backup file
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `charnoks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setBackupStatus('Backup created and downloaded successfully!');
    } catch (err: any) {
      setBackupStatus(`Failed to create backup: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupStatus(null), 5000);
    }
  };

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-text-primary">Data Backup</h3>
      <p className="text-text-secondary mb-4">
        Create a complete backup of your business data including sales, expenses, products, and user information.
      </p>

      {backupStatus && (
        <div className={`text-sm p-2 rounded-lg mb-4 ${backupStatus.includes('Failed')
            ? 'text-red-400 bg-red-500/10'
            : 'text-green-400 bg-green-500/10'
          }`}>
          {backupStatus}
        </div>
      )}

      <button
        onClick={handleCreateBackup}
        disabled={isCreatingBackup}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center"
      >
        {isCreatingBackup && <Spinner size="sm" />}
        <span className={isCreatingBackup ? 'ml-2' : ''}>
          {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
        </span>
      </button>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <header className="animate-bounce-in">
        <h1 className="text-4xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Configure your application and manage users.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <ThemeSelector />

        {user?.role === 'owner' && (
          <>
            <CreateWorkerForm />
            <UserManagement />
            <BackupSection />
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
```
## pages/SignUpPage.tsx

```tsx
import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useSupabaseAuth';
import Spinner from '../components/ui/Spinner';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z" clipRule="evenodd" />
        <path d="M2 10s3.939-7 8-7 8 7 8 7-3.939 7-8 7-8-7-8-7zm7.939 2.553a2.5 2.5 0 01-3.498-3.498l3.498 3.498z" />
    </svg>
);

const LogoIcon = () => (
    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl p-2">
        <img 
            src="/Charnoks logo-192x192.png" 
            alt="Charnoks Logo" 
            className="w-20 h-20 object-contain drop-shadow-lg" 
        />
    </div>
);

const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSigningUp(true);
        try {
            // Always create as owner account through signup page
            const user = await auth.signup(name, email, password);
            // Navigate based on role
            if (user.role === 'owner') {
                navigate('/owner/dashboard', { replace: true });
            } else {
                // This should never happen for new signups
                navigate('/worker/dashboard', { replace: true });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create an account. Please try again.");
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4 animate-bounce-in" style={{animationDelay: '100ms'}}>
                    <div className="flex justify-center">
                        <LogoIcon />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-center gap-3 animate-bounce-in" style={{animationDelay: '150ms'}}>
                            <img 
                                src="/Charnoks logo-192x192.png" 
                                alt="Charnoks" 
                                className="w-12 h-12 object-contain drop-shadow-lg" 
                            />
                            <h1 className="text-5xl font-bold brand-title">
                                CHARNOKS
                            </h1>
                        </div>
                        <p className="text-lg brand-subtitle mt-2 animate-bounce-in" style={{animationDelay: '200ms'}}>
                            Point of Sale System
                        </p>
                        <p className="text-sm text-white/70 mt-1 animate-bounce-in" style={{animationDelay: '250ms'}}>
                            🍗 Special Fried Chicken & More
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-center text-white animate-bounce-in" style={{animationDelay: '300ms'}}>🚀 Create Owner Account</h2>
                <p className="text-center text-white/80 animate-bounce-in" style={{animationDelay: '350ms'}}>Set up your Charnoks restaurant management system</p>

                <form className="space-y-5 animate-bounce-in" style={{animationDelay: '400ms'}} onSubmit={handleSignUp}>
                    <div>
                        <label htmlFor="full-name" className="sr-only">Full Name</label>
                         <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                            <span className="px-3 text-white/70"><UserIcon /></span>
                            <input
                                id="full-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full bg-transparent py-2.5 pr-3 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Full Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                         <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                            <span className="px-3 text-white/70"><MailIcon /></span>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full bg-transparent py-2.5 pr-3 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Email address"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                             <span className="px-3 text-white/70"><LockIcon /></span>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full bg-transparent py-2.5 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-white/70 focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                        <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                             <span className="px-3 text-white/70"><LockIcon /></span>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full bg-transparent py-2.5 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-300 text-sm text-center bg-red-500/20 p-2 rounded-lg">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isSigningUp}
                            className="w-full flex justify-center py-3 px-4 text-base font-bold rounded-lg text-text-on-primary bg-card-bg-solid shadow-lg shadow-black/20 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-50"
                        >
                            {isSigningUp ? <Spinner size="sm" /> : 'Sign Up'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-white/60 animate-bounce-in" style={{animationDelay: '500ms'}}>
                    Already have an account? <Link to="/login" className="font-medium text-white/80 hover:text-white">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
```

## pages/StockManagementPage.tsx

```tsx

import React, { useState, PropsWithChildren } from 'react';
import KPICard from '../components/ui/KPI_Card';
import { getWorkersList } from '../services/supabaseService';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import Spinner from '../components/ui/Spinner';

// Reusable CollapsibleSection component for this page
const CollapsibleSection: React.FC<PropsWithChildren<{ title: string; defaultOpen?: boolean }>> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left transition-colors hover:bg-white/5"
            >
                <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transform transition-transform text-text-secondary ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20" fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-6 border-t border-border/50 animate-slide-in-bottom">
                    {children}
                </div>
            )}
        </div>
    );
};

const productTypes = ['Drumstick', 'Thigh', 'Breast', 'Wing', 'Neck', 'Other'];

const StockManagementPage: React.FC = () => {
    // For new users, show zero values
    const [stockReceivedToday] = useState(0);
    const [stockSentToday] = useState(0);
    const [remainingStock] = useState(0);
    const [selectedBranch, setSelectedBranch] = useState('');

    // Load workers data
    const { loadingState: workersState } = useEnhancedDataLoading(
        () => getWorkersList(),
        {
            cacheKey: 'stock-workers',
            cacheDuration: 10 * 60 * 1000,
            maxRetries: 2
        }
    );

    const workers = workersState.data || [];
    const isLoading = workersState.loading && !workersState.data;
    const hasError = workersState.error && !workersState.data;

    // Set default selected branch when workers load
    React.useEffect(() => {
        if (workers.length > 0 && !selectedBranch) {
            setSelectedBranch(workers[0].id);
        }
    }, [workers, selectedBranch]);

    return (
        <div className="space-y-8">
            {/* Error banner for data loading issues (non-blocking) */}
            {hasError && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="text-yellow-400 mr-3">⚠️</span>
                        <div>
                            <h3 className="text-yellow-300 font-medium">Unable to load worker data</h3>
                            <p className="text-yellow-400/80 text-sm">
                                Stock management forms will work, but worker selection may be limited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Stock Management</h1>
                <p className="text-text-secondary mt-1">
                    {stockReceivedToday === 0 && stockSentToday === 0 ? 
                        'Start recording stock movements to track inventory flow.' :
                        'Manage stock from supplier to branch.'
                    }
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Stock Received Today" value={`${stockReceivedToday} kg`} icon="📦" />
                <KPICard title="Stock Sent to Branches" value={`${stockSentToday} kg`} icon="🚚" />
                <KPICard title="Remaining in Storage" value={`${remainingStock} kg`} icon="🏠" />
            </div>

            <div className="space-y-6">
                <CollapsibleSection title="1. Receive Stock from Supplier" defaultOpen>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Supplier Name</label>
                            <input type="text" placeholder="e.g. Farm Fresh Inc." className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Total Quantity Received (kg)</label>
                                <input type="number" placeholder="50" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                                <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full bg-white/5 border-2 border-border/50 rounded-lg p-3 focus:ring-0" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
                            <textarea placeholder="Notes about the delivery..." rows={3} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition"></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80">Record Received Stock</button>
                        </div>
                    </form>
                </CollapsibleSection>

                <CollapsibleSection title="2. Process Stock into Packages">
                     <div className="space-y-3">
                        <div className="flex items-center gap-4 font-semibold text-text-secondary px-2">
                           <div className="flex-1">Product Type</div>
                           <div className="w-24">Quantity</div>
                           <div className="flex-1">Notes</div>
                        </div>
                         {productTypes.slice(0, 3).map(type => (
                             <div key={type} className="flex items-center gap-4 p-2 rounded-lg bg-black/20">
                                 <select className="flex-1 bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition text-text-primary">
                                     {productTypes.map(pt => <option key={pt}>{pt}</option>)}
                                 </select>
                                 <input type="number" placeholder="10" className="w-24 bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition" />
                                 <input type="text" placeholder="Notes..." className="flex-1 bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition" />
                             </div>
                         ))}
                     </div>
                     <div className="flex justify-end mt-4">
                        <button type="button" className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80">Record Processed Stock</button>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="3. Deliver Stock to Branch">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Select Worker/Branch</label>
                            <select className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary">
                                {workers.length === 0 ? (
                                    <option>No workers available - Create worker accounts first</option>
                                ) : (
                                    workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Packages to Deliver:</label>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {productTypes.slice(0, 4).map(type => (
                                    <div key={type}>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">{type} (packs)</label>
                                         <input type="number" placeholder="0" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition" />
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
                            <textarea placeholder="e.g. Delivery instructions" rows={3} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition"></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80">Send Stock to Branch</button>
                        </div>
                    </form>
                </CollapsibleSection>

                <CollapsibleSection title="4. Current Branch Stock Viewer">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Select Worker/Branch</label>
                        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full max-w-sm bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary">
                             {workers.length === 0 ? (
                                <option>No workers available</option>
                             ) : (
                                workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                             )}
                        </select>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="border-b border-border/50">
                                <tr>
                                    <th className="p-3 font-semibold text-text-secondary">Product Type</th>
                                    <th className="p-3 font-semibold text-text-secondary">Quantity in Stock (packs)</th>
                                    <th className="p-3 font-semibold text-text-secondary">Last Updated</th>
                                </tr>
                           </thead>
                           <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center">
                                            <Spinner size="lg" />
                                        </td>
                                    </tr>
                                ) : workers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-text-secondary">
                                            <div className="space-y-2">
                                                <p>No worker/branch data available</p>
                                                <p className="text-sm">Create worker accounts to track branch stock</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    productTypes.slice(0, 4).map((type) => (
                                         <tr key={type} className="border-b border-border/30">
                                             <td className="p-3">{type}</td>
                                             <td className="p-3 text-text-secondary">0 packs</td>
                                             <td className="p-3 text-text-secondary">No data yet</td>
                                         </tr>
                                    ))
                                )}
                           </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    );
};

export default StockManagementPage;
```
## pages/TransactionsPage.tsx

```tsx

import React, { useState, useMemo } from 'react';
import type { Sale } from '../types';
import { getSales, getWorkersList } from '../services/supabaseService';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import Spinner from '../components/ui/Spinner';

const TransactionRow: React.FC<{ sale: Sale; workers: any[] }> = ({ sale, workers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const workerName = workers.find(w => w.id === sale.workerId)?.name || sale.workerName || 'Unknown';

    return (
        <>
            <tr onClick={() => setIsOpen(!isOpen)} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer">
                <td className="p-3 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{workerName}</td>
                <td className="p-3 text-center">{sale.items.length}</td>
                <td className="p-3 text-right font-semibold text-green-400 whitespace-nowrap">{`$${sale.total.toFixed(2)}`}</td>
                <td className="p-3 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mx-auto transition-transform duration-300 text-text-secondary ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </td>
            </tr>
            {isOpen && (
                <tr className="bg-black/20">
                    <td colSpan={5} className="p-4 border-b border-border/50">
                        <div className="space-y-2 max-w-md mx-auto">
                             <h4 className="font-bold text-text-primary">Sale Items:</h4>
                             {sale.items.map((item, index) => {
                                 const productName = (item as any).productName || item.name || `Product ${item.productId}`;
                                 const itemPrice = item.price || 0;
                                 return (
                                     <div key={index} className="flex justify-between text-text-secondary text-sm ml-4">
                                         <span>{productName} &times; {item.quantity}</span>
                                         <span>${(itemPrice * item.quantity).toFixed(2)}</span>
                                     </div>
                                 );
                             })}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};


const TransactionsPage: React.FC = () => {
    const [workerFilter, setWorkerFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    
    const TRANSACTIONS_PER_PAGE = 15;
    type DateFilter = 'all' | 'today' | '7d' | '30d';

    // Load data with enhanced error handling
    const { loadingState: salesState } = useEnhancedDataLoading(
        () => getSales(200), // Load more transactions
        {
            cacheKey: 'transactions-sales',
            cacheDuration: 2 * 60 * 1000, // 2 minutes
            maxRetries: 2
        }
    );

    const { loadingState: workersState } = useEnhancedDataLoading(
        () => getWorkersList(),
        {
            cacheKey: 'transactions-workers',
            cacheDuration: 10 * 60 * 1000, // 10 minutes
            maxRetries: 2
        }
    );

    // Get data or use empty arrays
    const sales = salesState.data || [];
    const workers = workersState.data || [];
    
    const isLoading = (salesState.loading && !salesState.data) || (workersState.loading && !workersState.data);
    // const hasError = (salesState.error && !salesState.data) || (workersState.error && !workersState.data);

    const dateFilters: { id: DateFilter, label: string }[] = [
        { id: 'all', label: 'All Time' },
        { id: 'today', label: 'Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

    const filteredSales = useMemo(() => {
        let filteredSales = [...sales];

        // Worker filter
        if (workerFilter !== 'all') {
            filteredSales = filteredSales.filter(sale => sale.workerId === workerFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();
            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateFilter === '30d') {
                startDate.setDate(now.getDate() - 30);
            }
            filteredSales = filteredSales.filter(sale => new Date(sale.date) >= startDate && new Date(sale.date) <= now);
        }
        
        return filteredSales;
    }, [sales, workerFilter, dateFilter]);
    
    const sortedSales = useMemo(() => {
        return [...filteredSales].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [filteredSales, sortOrder]);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
        return sortedSales.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE);
    }, [sortedSales, currentPage]);

    const totalPages = Math.ceil(sortedSales.length / TRANSACTIONS_PER_PAGE);

    const handleSort = () => {
        setSortOrder((prev: string) => (prev === 'desc' ? 'asc' : 'desc'));
    };

    return (
        <div className="space-y-8">


            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Transaction History</h1>
                <p className="text-text-secondary mt-1">
                    {sales.length === 0 ? 'Start recording sales to see transaction history.' : 'Browse, filter, and sort all past sales.'}
                </p>
            </header>

            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="worker-filter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Worker</label>
                            <select id="worker-filter" value={workerFilter} onChange={e => { setWorkerFilter(e.target.value); setCurrentPage(1); }} className="w-full max-w-xs bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition text-text-primary">
                                <option value="all">All Workers</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Filter by Date</label>
                            <div className="flex items-center bg-black/20 p-1 rounded-lg">
                                {dateFilters.map(range => (
                                    <button key={range.id} onClick={() => { setDateFilter(range.id); setCurrentPage(1); }} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dateFilter === range.id ? 'bg-primary text-text-on-primary' : 'text-text-secondary hover:bg-white/10'}`}>
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                         <h2 className="text-2xl font-bold">Total Sales Found</h2>
                         <p className="text-3xl font-bold text-primary">{sortedSales.length}</p>
                    </div>
                </div>
                 <div className="overflow-auto max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-left table-auto">
                                <thead className="sticky top-0 bg-card-bg-solid/80 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-3 font-semibold text-text-secondary">
                                            <button onClick={handleSort} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                                                Date & Time
                                                {sortOrder === 'desc' ? '▼' : '▲'}
                                            </button>
                                        </th>
                                        <th className="p-3 font-semibold text-text-secondary">Worker</th>
                                        <th className="p-3 font-semibold text-text-secondary text-center">Items</th>
                                        <th className="p-3 font-semibold text-text-secondary text-right">Total</th>
                                        <th className="p-3 font-semibold text-text-secondary text-center w-20">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                   {paginatedSales.map((sale: any) => (
                                       <TransactionRow key={sale.id} sale={sale} workers={workers} />
                                   ))}
                                </tbody>
                            </table>
                            {paginatedSales.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-primary text-2xl">📊</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                                        {sales.length === 0 ? 'No Transactions Yet' : 'No transactions found for the selected filters'}
                                    </h3>
                                    <p className="text-text-secondary mb-4">
                                        {sales.length === 0 ? 
                                            'Start recording sales to see your transaction history here.' :
                                            'Try adjusting your filters to see more results.'
                                        }
                                    </p>
                                    {sales.length === 0 && (
                                        <button
                                            onClick={() => window.location.href = '/sales'}
                                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Record First Sale
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white/10 rounded-lg text-text-primary font-semibold transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white/10 rounded-lg text-text-primary font-semibold transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;
```

## pages/Workerdashboard.tsx

```tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../components/ui/KPI_Card';
import { subscribeToWorkerSales } from '../services/supabaseService';
import { useAuth } from '../hooks/useSupabaseAuth';
import type { Sale } from '../types';

const WorkerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        // Subscribe to sales for the current worker
        const unsubscribe = subscribeToWorkerSales(user.uid, (newSales) => {
            setSales(newSales);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Calculate today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.date);
        return saleDate >= today;
    });

    const salesToday = todaySales.length;
    const revenueToday = todaySales.reduce((sum: number, sale: any) => sum + sale.total, 0);

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-text-secondary mt-1">Here's your summary for today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <>
                        <KPICard title="Your Sales Today" value="Loading..." icon="🛒" />
                        <KPICard title="Your Revenue Today" value="Loading..." icon="💰" />
                    </>
                ) : (
                    <>
                        <KPICard title="Your Sales Today" value={salesToday.toString()} icon="🛒" />
                        <KPICard title="Your Revenue Today" value={`$${revenueToday.toFixed(2)}`} icon="💰" />
                    </>
                )}
            </div>

            <div className="animate-slide-in-bottom">
                <Link
                    to="/worker/sales"
                    className="block w-full text-center p-6 bg-primary rounded-2xl text-text-on-primary font-bold text-2xl transition-transform duration-300 hover:scale-105 shadow-lg"
                >
                    + Record a New Sale
                </Link>
            </div>
        </div>
    );
};

export default WorkerDashboard;
```

---

## Summary

This document contains all the code from the pages folder of the Charnoks POS system. The pages include:

1. **Owner Pages**: Dashboard, Home Page with analytics
2. **Authentication**: Login and Sign Up pages
3. **Business Management**: Products, Sales, Expenses, Transactions
4. **Analytics**: Advanced Analytics, Analysis Center
5. **AI Features**: AI Assistant with chat interface
6. **Management**: Settings, Stock Management, Notes/Internal Log
7. **Worker Dashboard**: Simplified dashboard for workers

Each page is built with React TypeScript and includes:
- Responsive design with Tailwind CSS
- Error handling and loading states
- Real-time data updates
- Modern UI components
- Accessibility features
- Mobile-friendly interfaces

The pages work together to provide a complete point-of-sale and business management system for restaurants.