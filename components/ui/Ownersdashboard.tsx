import React, { useState, useEffect } from 'react';
import KPICard from '../ui/KPI_Card';
import ChartContainer from '../charts/ChartContainer';
import { getOwnerDashboard } from '../../services/firebaseService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import CreateWorkerForm from '../CreateWorkerForm';
import Spinner from '../ui/Spinner';

interface CustomizedLabelProps {
    cx: number;
    cy: number;
    midAngle?: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
}

const Ownersdashboard: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWorkerForm, setShowWorkerForm] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await getOwnerDashboard();
                setDashboardData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data');
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

    if (!dashboardData) {
        return (
            <div className="text-center text-text-secondary p-4">
                No dashboard data available
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
                    <p className="text-text-secondary mt-1">Welcome back, Owner!</p>
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
                    trend="+5.2% this month" 
                    trendDirection="up" 
                />
                <KPICard 
                    title="Net Profit" 
                    value={`$${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
                    icon="📈" 
                    trend="+3.1% this month" 
                    trendDirection="up" 
                />
                <KPICard 
                    title="Transactions" 
                    value={transactions.toLocaleString()} 
                    icon="🛒" 
                    trend="-1.4% this month" 
                    trendDirection="down" 
                />
                <KPICard 
                    title="Top Product" 
                    value={topProducts[0]?.name || 'No sales yet'} 
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
                                <YAxis tick={{ fill: 'rgb(var(--text-secondary))' }} fontSize={12} tickFormatter={(value) => `$${value}`} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
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
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {topProducts.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
                                <Legend iconSize={10} wrapperStyle={{fontSize: '12px', color: 'rgb(var(--text-secondary))', paddingBottom: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};

export default Ownersdashboard;