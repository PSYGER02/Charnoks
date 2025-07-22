
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../components/ui/KPI_Card';
import { subscribeToWorkerSales } from '../services/salesService';
import { useAuth } from '../hooks/useAuth';
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
    
    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today;
    });

    const salesToday = todaySales.length;
    const revenueToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);

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
