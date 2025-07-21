import React, { useState, useEffect } from 'react';
import { getSalesAnalytics, getWorkersList, getWorkerPerformance, formatCurrency, formatDate } from '../services/firebaseService';
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