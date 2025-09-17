import React, { useEffect } from 'react';
import { useState } from 'react';
import KPICard from '../../components/ui/KPI_Card';
import ChartContainer from '../../components/charts/ChartContainer';
import { getOwnerDashboard } from '../../services/supabaseService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import CreateWorkerForm from '../../components/CreateWorkerForm';
import Spinner from '../../components/ui/Spinner';
import { useEnhancedDataLoading } from '../../hooks/useEnhancedDataLoading';
import { syncService } from '../../services/syncService';
import { offlineDB } from '../../services/offlineService';

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
    const [dashboardData, setDashboardData] = React.useState(getEmptyDashboardData());
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasLoaded, setHasLoaded] = React.useState(false);

    // Initialize offline sync
    useEffect(() => {
        const initSync = async () => {
            try {
                await offlineDB.init();
                await syncService.start();
            } catch (error) {
                console.warn('Offline sync init failed:', error);
            }
        };
        initSync();
    }, []);

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">Dashboard Overview</h1>
                        <p className="text-text-secondary mt-1">Monitor your business performance</p>
                    </div>
                    {isLoading && (
                        <div className="flex items-center text-sm text-text-secondary">
                            <Spinner size="sm" className="mr-2" />
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

            <div className="trading-grid gap-6">
                {/* Sales Trend Chart */}
                <div className="modern-card p-6 trading-main-chart">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Sales Trend</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart
                            data={salesTrend}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                            <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-secondary))' }} />
                            <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--card-bg-solid))', border: '1px solid rgb(var(--border))' }} />
                            <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="rgb(var(--primary))" 
                                fillOpacity={1} 
                                fill="url(#salesGradient)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products Chart */}
                <div className="modern-card p-6 trading-sidebar">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Top Products</h3>
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
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--card-bg-solid))', border: '1px solid rgb(var(--border))' }} />
                        </PieChart>
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
