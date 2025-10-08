import React, { useEffect } from 'react';
import { useState } from 'react';
import KPICard from '../../components/ui/KPI_Card';
import { getOwnerDashboard } from '../../services/supabaseService';
import { BarChart, Bar, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import Spinner from '../../components/ui/Spinner';
import { smartSyncService } from '../../services/smartSyncService';
import { offlineDB } from '../../services/offlineService';
import CreateWorkerForm from '../../components/CreateWorkerForm';
import { useEnhancedDataLoading } from '../../hooks/useEnhancedDataLoading';
import QuickStats from '../../components/dashboard/QuickStats';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import QuickGoals from '../../components/dashboard/QuickGoals';
import WeatherWidget from '../../components/dashboard/WeatherWidget';
import { PerformanceRanking, QuickStatsGrid, ProgressIndicator, ActivityTimeline } from '../../components/ui/PerformanceComponents';
import { BusinessStatusOverview } from '../../components/ui/BusinessStatusOverview';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

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
    const [dashboardData, setDashboardData] = React.useState(getEmptyDashboardData());
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasLoaded, setHasLoaded] = React.useState(false);

        // Initialize smart sync service (only syncs when connection is stable)
    useEffect(() => {
        const initSync = async () => {
            try {
                smartSyncService.start();
                console.log('Smart sync service started - syncs only when connection is stable');
            } catch (error) {
                console.warn('Smart sync init failed:', error);
            }
        };

        initSync();
    }, []);  // Added missing closing bracket and dependency array

    // Load data in background after component mounts
    React.useEffect(() => {
        const loadDashboardData = async () => {
            if (hasLoaded) return;
            
            setIsLoading(true);
            setHasLoaded(true);
            
            try {
                const data = await getOwnerDashboard();
                setDashboardData(data);
            } catch (error) {
                console.warn('Dashboard data not loaded:', error);
                // Keep empty data, don't show error to new users
            } finally {
                setIsLoading(false);
            }
        };

        // Small delay to show UI first
        setTimeout(loadDashboardData, 100);
    }, [hasLoaded]);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const data = await getOwnerDashboard();
            setDashboardData(data);
        } catch (error) {
            console.warn('Dashboard refresh failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const { totalRevenue, netProfit, transactions, salesTrend, topProducts } = dashboardData;

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">Dashboard Overview</h1>
                        <p className="text-text-secondary mt-1">Monitor your business performance</p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center text-sm text-text-secondary">
                            <div className="mr-2"><Spinner size="sm" /></div>
                            <span>Updating...</span>
                        </div>
                    )}
                    {!isLoading && hasLoaded && (
                        <button
                            onClick={refresh}
                            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>
            </header>

            <div className="trading-grid gap-6">
                <KPICard 
                    title="Total Revenue" 
                    value={`₱${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="💰" 
                    trend={totalRevenue > 0 ? "+12.5%" : undefined}
                    trendDirection={totalRevenue > 0 ? "up" : undefined}
                    sparklineData={salesTrend.map(d => d.sales)}
                />
                <KPICard 
                    title="Net Profit" 
                    value={`₱${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon={netProfit >= 0 ? "📈" : "📉"}
                    trend={netProfit !== 0 ? (netProfit > 0 ? "+8.2%" : "-3.1%") : undefined}
                    trendDirection={netProfit > 0 ? "up" : netProfit < 0 ? "down" : undefined}
                />
                <KPICard 
                    title="Total Transactions" 
                    value={transactions.toString()} 
                    icon="🛍️" 
                    trend={transactions > 0 ? "+5 today" : undefined}
                    trendDirection={transactions > 0 ? "up" : undefined}
                />
            </div>

            {/* Beautiful Performance Dashboard */}
            <div className="trading-grid gap-6">
                {/* Quick Stats */}
                <div className="trading-full-width">
                    <QuickStatsGrid stats={[
                        { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, change: 12.5, icon: DollarSign },
                        { label: 'Transactions', value: transactions, change: 8.2, icon: TrendingUp },
                        { label: 'Active Workers', value: 4, change: 0, icon: Users },
                        { label: 'Monthly Goal', value: '85%', change: 5.1, icon: Target }
                    ]} />
                </div>

                {/* Performance Metrics Row */}
                <div className="trading-half">
                    <ProgressIndicator 
                        label="Monthly Sales Goal"
                        current={totalRevenue}
                        target={100000}
                        unit="₱"
                        color="success"
                    />
                </div>
                
                <div className="trading-half">
                    <ProgressIndicator 
                        label="Daily Transactions Target"
                        current={transactions}
                        target={50}
                        color="primary"
                    />
                </div>

                {/* Performance Ranking */}
                <div className="trading-half">
                    <PerformanceRanking workers={[
                        { name: 'Juan Santos', sales: 25000, rank: 1, change: 15.2 },
                        { name: 'Maria Garcia', sales: 22000, rank: 2, change: 8.7 },
                        { name: 'Carlos Rodriguez', sales: 18000, rank: 3, change: -2.1 },
                        { name: 'Ana Reyes', sales: 15000, rank: 4, change: 12.3 }
                    ]} />
                </div>

                {/* Recent Activity */}
                <div className="trading-half">
                    <ActivityTimeline activities={[
                        { time: '2 mins ago', title: 'New Sale Recorded', description: '₱1,250 - Juan Santos', type: 'sale' },
                        { time: '15 mins ago', title: 'Expense Added', description: '₱500 - Office supplies', type: 'expense' },
                        { time: '1 hour ago', title: 'Note Created', description: 'Monthly inventory check', type: 'note' },
                        { time: '2 hours ago', title: 'Worker Check-in', description: 'Maria Garcia - BGC Branch', type: 'system' }
                    ]} />
            </div>
                {/* Business Status Overview */}
                <div className="trading-full-width">
                    <BusinessStatusOverview 
                        revenue={totalRevenue} 
                        expenses={dashboardData.totalExpenses} 
                        profit={netProfit} 
                        transactions={transactions} 
                    />
                </div>

                {/* Weather Widget */}
                <div className="trading-full-width">
                    <WeatherWidget location="Makati, PH" />
                </div>
            </div>

            {/* Charts Section */}  
            <div className="trading-grid gap-6">
                {/* Sales Trend Chart - Clean and Simple */}
                <div className="modern-card p-6 trading-main-chart">
                    <h3 className="text-xl font-bold text-text-primary mb-2">📈 Weekly Sales Trend</h3>
                    <p className="text-text-secondary mb-4">Track your daily sales performance</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesTrend}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis 
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickFormatter={(value: number) => `₱${value.toLocaleString()}`}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F3F4F6'
                                }}
                                formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Sales']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#059669" 
                                strokeWidth={3}
                                fill="url(#salesGradient)"
                                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products Chart - Simple Bar Chart */}
                <div className="modern-card p-6 trading-sidebar">
                    <h3 className="text-xl font-bold text-text-primary mb-2">🏆 Top Selling Products</h3>
                    <p className="text-text-secondary mb-4">Best performing products this week</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                            data={topProducts.slice(0, 5)} 
                            layout="horizontal"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                type="number"
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis 
                                type="category"
                                dataKey="name" 
                                stroke="#9CA3AF"
                                fontSize={12}
                                width={80}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F3F4F6'
                                }}
                                formatter={(value: any) => [value, 'Sales']}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="#059669"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Getting Started Guide for new users */}
            {totalRevenue === 0 && transactions === 0 && (
                <div className="modern-card p-6 animate-bounce-in">
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
