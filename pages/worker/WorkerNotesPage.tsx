import React, { useState } from 'react';
import { useAuth } from '../../hooks/useSupabaseAuth';
import Spinner from '../../components/ui/Spinner';
import SuccessOverlay from '../../components/ui/SuccessOverlay';
import { addNote } from '../../services/supabaseService';

const WorkerNotesPage: React.FC = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            setError('Please enter a title.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await addNote({
                title,
                description,
                category,
                amount: amount ? parseFloat(amount) : undefined
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setTitle('');
                setDescription('');
                setCategory('');
                setAmount('');
            }, 1500);
        } catch (err) {
            setError('Failed to add note. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 relative">
            {showSuccess && <SuccessOverlay />}
            <h1 className="text-2xl font-bold mb-6">Add Note</h1>
            
            <form onSubmit={handleAddNote} className="mb-8 bg-white/5 p-4 rounded-lg max-w-md">
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={3}
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Category (optional)"
                            className="w-full p-2 rounded bg-white/10 border border-border/50"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount (optional)"
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
                        {isLoading ? <Spinner size="sm" /> : 'Add Note'}
                    </button>
                </div>
                {error && <p className="mt-2 text-red-400">{error}</p>}
            </form>

            <div className="bg-white/5 rounded-lg p-4">
                <p className="text-text-secondary">Note added successfully! Your manager can view all notes.</p>
            </div>
        </div>
    );
};

export default WorkerNotesPage;