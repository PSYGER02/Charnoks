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
