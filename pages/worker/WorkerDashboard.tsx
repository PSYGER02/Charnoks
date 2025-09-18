
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../../components/ui/KPI_Card';
import { subscribeToWorkerSales } from '../../services/supabaseService';
import { getSalesOffline } from '../../services/enhancedOfflineDataService';
import { useAuth } from '../../hooks/useSupabaseAuth';
import type { Sale } from '../../types';

const WorkerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [dataSource, setDataSource] = useState<'online' | 'offline' | 'empty'>('empty');

    useEffect(() => {
        if (!user?.uid || hasAttemptedLoad) return;
        
        setLoading(true);
        setHasAttemptedLoad(true);

        const loadWorkerData = async () => {
            try {
                if (navigator.onLine) {
                    // Try real-time subscription when online
                    try {
                        const unsubscribe = subscribeToWorkerSales(user.uid, (newSales) => {
                            setSales(newSales);
                            setDataSource('online');
                            setLoading(false);
                        });
                        return () => unsubscribe();
                    } catch (error) {
                        console.warn('Worker sales subscription failed, using offline data:', error);
                    }
                }

                // Fallback to offline data or when offline
                const offlineSales = await getSalesOffline({ limit: 50 });
                // Filter for current worker's sales
                const workerSales = offlineSales.filter((sale: any) => 
                    sale.workerId === user.uid || sale.worker_id === user.uid
                );
                
                setSales(workerSales);
                setDataSource(offlineSales.length > 0 ? 'offline' : 'empty');
                setLoading(false);

            } catch (error) {
                console.warn('Failed to load worker data:', error);
                setLoading(false);
                setDataSource('empty');
            }
        };

        loadWorkerData();
    }, [user?.uid, hasAttemptedLoad]);

    // Calculate today's metrics - use useMemo for performance
    const { salesToday, revenueToday } = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = sales.filter((sale: any) => {
            const saleDate = new Date(sale.date);
            return saleDate >= today;
        });

        return {
            salesToday: todaySales.length,
            revenueToday: todaySales.reduce((sum: number, sale: any) => sum + sale.total, 0)
        };
    }, [sales]);

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-text-secondary mt-1">
                    Here's your summary for today.
                    {dataSource === 'offline' && (
                        <span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                            📱 Offline
                        </span>
                    )}
                    {dataSource === 'online' && (
                        <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-1 rounded">
                            🌐 Live
                        </span>
                    )}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KPICard 
                    title="Your Sales Today" 
                    value={loading ? "Loading..." : salesToday.toString()} 
                    icon="🛒" 
                />
                <KPICard 
                    title="Your Revenue Today" 
                    value={loading ? "Loading..." : `₱${revenueToday.toFixed(2)}`} 
                    icon="💰" 
                />
            </div>
            
            {/* Getting started guide for new workers */}
            {!loading && salesToday === 0 && revenueToday === 0 && (
                <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-6 animate-bounce-in border border-border/50">
                    <h2 className="text-xl font-bold text-text-primary mb-3">👋 Ready to start your day?</h2>
                    <p className="text-text-secondary mb-4">You haven't recorded any sales today yet. Click the button below to get started!</p>
                </div>
            )}

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
