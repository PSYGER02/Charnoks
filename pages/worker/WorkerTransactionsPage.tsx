import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useSupabaseAuth';
import { getSales } from '../../services/supabaseService';
import type { Sale } from '../../types';
import Spinner from '../../components/ui/Spinner';

const WorkerTransactionsPage: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadWorkerSales = async () => {
            if (!user) return;
            setIsLoading(true);
            
            try {
                const allSales = await getSales(100);
                // Filter to show only current worker's sales
                const workerSales = allSales.filter(sale => sale.workerId === user.uid);
                setSales(workerSales);
            } catch (error) {
                console.warn('Could not load sales:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadWorkerSales();
    }, [user]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Sales History</h1>
            
            <div className="bg-white/5 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h2 className="text-xl font-bold">My Transactions ({sales.length})</h2>
                    {isLoading && <Spinner size="sm" />}
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/10">
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Items</th>
                            <th className="p-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-3 text-center text-gray-400">
                                    No sales recorded yet.
                                </td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id} className="border-b border-border/50 hover:bg-white/5">
                                    <td className="p-3">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="p-3">{sale.items.length} items</td>
                                    <td className="p-3 text-right font-semibold text-green-400">₱{sale.total.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorkerTransactionsPage;