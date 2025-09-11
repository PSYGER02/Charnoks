import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useSupabaseAuth';
import CreateWorkerForm from '../../components/CreateWorkerForm';

const OwnerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [showWorkerForm, setShowWorkerForm] = useState(false);

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Account Dashboard</h1>
                <p className="text-text-secondary mt-1">Manage your account and workers</p>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    to="/owner/home"
                    className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Business Overview</h3>
                    <p className="text-blue-100">View sales, revenue, and performance metrics</p>
                </Link>

                <button
                    onClick={() => setShowWorkerForm(true)}
                    className="block p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="text-3xl mb-2">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Create Worker</h3>
                    <p className="text-green-100">Add new workers to your team</p>
                </button>

                <Link
                    to="/owner/settings"
                    className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <div className="text-3xl mb-2">⚙️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                    <p className="text-purple-100">Configure your account preferences</p>
                </Link>
            </div>

            {/* Account Information */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-text-secondary">Email</span>
                        <span className="text-text-primary">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-text-secondary">Role</span>
                        <span className="text-text-primary capitalize">{user?.role}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-text-secondary">Display Name</span>
                        <span className="text-text-primary">{user?.displayName}</span>
                    </div>
                </div>
            </div>

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
                        <CreateWorkerForm onSuccess={() => setShowWorkerForm(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
