import React, { useState, useEffect } from 'react';
import type { Expense } from '../types';
import { useAuth } from '../hooks/useSupabaseAuth';
import Spinner from '../components/ui/Spinner';
import SuccessOverlay from '../components/ui/SuccessOverlay';
import { getExpenses, recordExpense } from '../services/supabaseService';

const ExpenseRow: React.FC<{ expense: Expense }> = ({ expense }) => {
    return (
        <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
            <td className="p-3 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
            <td className="p-3">{expense.description}</td>
            <td className="p-3 whitespace-nowrap">{expense.workerName || 'Unknown'}</td>
            <td className="p-3 text-right font-semibold text-red-400 whitespace-nowrap">{`$${expense.amount.toFixed(2)}`}</td>
        </tr>
    );
};

const ExpensesPage: React.FC = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchExpenses = async () => {
            if (hasAttemptedLoad) return;
            setLoadingExpenses(true);
            setHasAttemptedLoad(true);
            
            try {
                const fetchedExpenses = await getExpenses();
                setExpenses(fetchedExpenses);
            } catch (err) {
                // Don't show error for new users, just keep empty state
                console.warn('Expenses not loaded:', err);
            } finally {
                setLoadingExpenses(false);
            }
        };
        
        // Small delay to show UI first, then load data
        setTimeout(fetchExpenses, 100);
    }, [hasAttemptedLoad]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please fill out all fields with valid values.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await recordExpense({
                description,
                amount: parseFloat(amount)
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setDescription('');
                setAmount('');
            }, 1500);

            // Refresh expenses list in background
            try {
                const updatedExpenses = await getExpenses();
                setExpenses(updatedExpenses);
            } catch (refreshErr) {
                console.warn('Could not refresh expenses list:', refreshErr);
            }
        } catch (err) {
            setError('Failed to add expense. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Show content immediately, with loading indicator if needed
    const showLoadingSpinner = loadingExpenses && expenses.length === 0;

    return (
        <div className="container mx-auto px-4 py-8 relative">
            {showSuccess && <SuccessOverlay />}
            <h1 className="text-2xl font-bold mb-6">Expenses</h1>
            
            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="mb-8 bg-white/5 p-4 rounded-lg">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div className="w-48">
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
                        className="px-6 py-2 bg-primary hover:bg-primary/80 rounded text-white disabled:opacity-50"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Add Expense'}
                    </button>
                </div>
                {error && <p className="mt-2 text-red-400">{error}</p>}
            </form>

            {/* Expenses Table */}
            <div className="bg-white/5 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h2 className="text-xl font-bold">Expense History ({expenses.length})</h2>
                    {showLoadingSpinner && <Spinner size="sm" />}
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/10">
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Description</th>
                            <th className="p-3 text-left">Worker</th>
                            <th className="p-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-3 text-center text-gray-400">
                                    No expenses recorded yet.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <ExpenseRow key={expense.id} expense={expense} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpensesPage;
