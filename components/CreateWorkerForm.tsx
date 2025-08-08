import React, { useState } from 'react';
import { useAuth } from '../hooks/useSupabaseAuth';

const CreateWorkerForm: React.FC = () => {
    const { createWorkerAccount } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            await createWorkerAccount(name, email, password);
            setSuccess(true);
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to create worker account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-900/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg">
                    Worker account created successfully! They can now log in with their credentials.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter worker's full name"
                        className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="worker@example.com"
                        className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition text-text-primary"
                    />
                    <p className="text-xs text-text-secondary mt-1">The worker will use this email and password to log in.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors font-medium"
                >
                    {loading ? 'Creating Account...' : 'Create Worker Account'}
                </button>
            </form>
        </div>
    );
};

export default CreateWorkerForm;
