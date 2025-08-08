import React, { useState } from 'react';
import KPICard from '../ui/KPI_Card';
import ChartContainer from '../charts/ChartContainer';
import { getOwnerDashboard } from '../../services/supabaseService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import CreateWorkerForm from '../CreateWorkerForm';
import Spinner from '../ui/Spinner';
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