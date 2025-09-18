import React, { useState } from 'react';
import { useAuth } from '../../hooks/useSupabaseAuth';
import Spinner from '../../components/ui/Spinner';
import SuccessOverlay from '../../components/ui/SuccessOverlay';
import { smartSaveService } from '../../services/smartSaveService';
import ConnectionStatus from '../../components/ui/ConnectionStatus';

const WorkerExpensePage: React.FC = () => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please fill out all fields with valid values.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            const result = await smartSaveService.saveExpense({
                description,
                amount: parseFloat(amount)
            });
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save expense');
            }

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setDescription('');
                setAmount('');
            }, 1500);
        } catch (err) {
            setError('Failed to add expense. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <ConnectionStatus />
            {showSuccess && <SuccessOverlay />}
            <h1 className="text-2xl font-bold mb-6">Record Expense</h1>
            
            <form onSubmit={handleAddExpense} className="mb-8 bg-white/5 p-4 rounded-lg max-w-md">
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div>
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
                        className="w-full px-6 py-2 bg-primary hover:bg-primary/80 rounded text-white disabled:opacity-50"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Record Expense'}
                    </button>
                </div>
                {error && <p className="mt-2 text-red-400">{error}</p>}
            </form>

            <div className="bg-white/5 rounded-lg p-4">
                <p className="text-text-secondary">Expense recorded successfully! Your manager will review all expenses.</p>
            </div>
        </div>
    );
};

export default WorkerExpensePage;