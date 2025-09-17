import React, { useState, useEffect, useMemo } from 'react';
import type { Expense } from '../../types';
import { useAuth } from '../../hooks/useSupabaseAuth';
import Spinner from '../../components/ui/Spinner';
import SuccessOverlay from '../../components/ui/SuccessOverlay';
import { getExpenses, recordExpense } from '../../services/supabaseService';
import { getWorkers } from '../../services/workerService';

const ExpenseRow: React.FC<{ expense: Expense; workers: any[] }> = ({ expense, workers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const workerName = workers.find(w => w.id === expense.workerId)?.name || expense.workerName || 'Unknown';

    return (
        <>
            <tr onClick={() => setIsOpen(!isOpen)} className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer">
                <td className="p-3 whitespace-nowrap">{new Date(expense.date).toLocaleString()}</td>
                <td className="p-3">{expense.description}</td>
                <td className="p-3 whitespace-nowrap">{workerName}</td>
                <td className="p-3 text-right font-semibold text-red-400 whitespace-nowrap">{`₱${expense.amount.toFixed(2)}`}</td>
                <td className="p-3 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mx-auto transition-transform duration-300 text-text-secondary ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </td>
            </tr>
            {isOpen && (
                <tr className="bg-black/20">
                    <td colSpan={5} className="p-4 border-b border-border/50">
                        <div className="space-y-2 max-w-md mx-auto">
                            <h4 className="font-bold text-text-primary">Expense Details:</h4>
                            <div className="text-text-secondary text-sm ml-4 space-y-1">
                                <div><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</div>
                                <div><strong>Worker:</strong> {workerName}</div>
                                <div><strong>Amount:</strong> ₱{expense.amount.toFixed(2)}</div>
                                <div><strong>Description:</strong> {expense.description}</div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const ExpensesPage: React.FC = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Filters and pagination
    const [workerFilter, setWorkerFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const EXPENSES_PER_PAGE = 15;
    type DateFilter = 'all' | 'today' | '7d' | '30d';

    useEffect(() => {
        const fetchData = async () => {
            if (hasAttemptedLoad) return;
            setLoadingExpenses(true);
            setHasAttemptedLoad(true);
            
            try {
                const [expensesData, workersData] = await Promise.all([
                    getExpenses(50),
                    getWorkers()
                ]);
                setExpenses(expensesData);
                setWorkers(workersData);
            } catch (err) {
                console.warn('Expenses data not loaded:', err);
            } finally {
                setLoadingExpenses(false);
            }
        };
        
        fetchData();
    }, [hasAttemptedLoad]);

    const dateFilters: { id: DateFilter, label: string }[] = [
        { id: 'all', label: 'All Time' },
        { id: 'today', label: 'Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

    const filteredExpenses = useMemo(() => {
        let filtered = [...expenses];

        if (workerFilter !== 'all') {
            filtered = filtered.filter(expense => expense.workerId === workerFilter);
        }

        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();
            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateFilter === '30d') {
                startDate.setDate(now.getDate() - 30);
            }
            filtered = filtered.filter(expense => new Date(expense.date) >= startDate && new Date(expense.date) <= now);
        }
        
        return filtered;
    }, [expenses, workerFilter, dateFilter]);
    
    const sortedExpenses = useMemo(() => {
        return [...filteredExpenses].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [filteredExpenses, sortOrder]);

    const paginatedExpenses = useMemo(() => {
        const startIndex = (currentPage - 1) * EXPENSES_PER_PAGE;
        return sortedExpenses.slice(startIndex, startIndex + EXPENSES_PER_PAGE);
    }, [sortedExpenses, currentPage]);

    const totalPages = Math.ceil(sortedExpenses.length / EXPENSES_PER_PAGE);

    const handleSort = () => {
        setSortOrder((prev: string) => (prev === 'desc' ? 'asc' : 'desc'));
    };

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

            try {
                const updatedExpenses = await getExpenses(50);
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

    return (
        <div className="space-y-8">
            {showSuccess && <SuccessOverlay />}
            
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Expense Management</h1>
                <p className="text-text-secondary mt-1">
                    {expenses.length === 0 ? 'Start recording expenses to track your business costs.' : 'Track, filter, and manage all business expenses.'}
                </p>
            </header>
            
            {/* Add Expense Form */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <h2 className="text-xl font-bold text-text-primary mb-4">Add New Expense</h2>
                <form onSubmit={handleAddExpense}>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Expense description"
                                className="w-full p-3 rounded-lg bg-transparent border-2 border-border/50 focus:border-primary focus:ring-0 transition text-text-primary"
                            />
                        </div>
                        <div className="w-48">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Amount (₱)"
                                step="0.01"
                                min="0"
                                className="w-full p-3 rounded-lg bg-transparent border-2 border-border/50 focus:border-primary focus:ring-0 transition text-text-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg text-white font-semibold transition disabled:opacity-50"
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Add Expense'}
                        </button>
                    </div>
                    {error && <p className="mt-2 text-red-400">{error}</p>}
                </form>
            </div>

            {/* Expenses Table */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="worker-filter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Worker</label>
                            <select id="worker-filter" value={workerFilter} onChange={e => { setWorkerFilter(e.target.value); setCurrentPage(1); }} className="w-full max-w-xs bg-transparent border-2 border-border/50 rounded-lg p-2 focus:border-primary focus:ring-0 transition text-text-primary [&>option]:bg-gray-800 [&>option]:text-white">
                                <option value="all">All Workers</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Filter by Date</label>
                            <div className="flex items-center bg-black/20 p-1 rounded-lg">
                                {dateFilters.map(range => (
                                    <button key={range.id} onClick={() => { setDateFilter(range.id); setCurrentPage(1); }} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dateFilter === range.id ? 'bg-primary text-text-on-primary' : 'text-text-secondary hover:bg-white/10'}`}>
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold">Total Expenses Found</h2>
                        <p className="text-3xl font-bold text-red-400">{sortedExpenses.length}</p>
                    </div>
                </div>
                
                <div className="overflow-auto max-h-[60vh]">
                    {loadingExpenses && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 mb-4">
                            <div className="flex items-center text-sm">
                                <Spinner size="sm" className="mr-2" />
                                <span className="text-blue-300">Loading expense data...</span>
                            </div>
                        </div>
                    )}
                    
                    <table className="w-full text-left table-auto">
                        <thead className="sticky top-0 bg-card-bg-solid/80 backdrop-blur-sm">
                            <tr>
                                <th className="p-3 font-semibold text-text-secondary">
                                    <button onClick={handleSort} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                                        Date & Time
                                        {sortOrder === 'desc' ? '▼' : '▲'}
                                    </button>
                                </th>
                                <th className="p-3 font-semibold text-text-secondary">Description</th>
                                <th className="p-3 font-semibold text-text-secondary">Worker</th>
                                <th className="p-3 font-semibold text-text-secondary text-right">Amount</th>
                                <th className="p-3 font-semibold text-text-secondary text-center w-20">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExpenses.map((expense: any) => (
                                <ExpenseRow key={expense.id} expense={expense} workers={workers} />
                            ))}
                        </tbody>
                    </table>
                    
                    {paginatedExpenses.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-red-400 text-2xl">💰</span>
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                {expenses.length === 0 ? 'No Expenses Yet' : 'No expenses found for the selected filters'}
                            </h3>
                            <p className="text-text-secondary mb-4">
                                {expenses.length === 0 ? 
                                    'Start recording expenses to track your business costs here.' :
                                    'Try adjusting your filters to see more results.'
                                }
                            </p>
                        </div>
                    )}
                </div>
                
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white/10 rounded-lg text-text-primary font-semibold transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white/10 rounded-lg text-text-primary font-semibold transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpensesPage;
