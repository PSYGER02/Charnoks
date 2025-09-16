import React, { useState, useEffect } from 'react';
import ThemeSelector from '../components/ui/ThemeSelector';
import { useAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../src/supabaseConfig';
import Spinner from '../components/ui/Spinner';
import SuccessOverlay from '../components/ui/SuccessOverlay';

const CreateWorkerForm: React.FC = () => {
  const { createWorkerAccount } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);

    try {
      await createWorkerAccount(name, email, password);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setName('');
        setEmail('');
        setPassword('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create worker account.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg mt-8 animate-slide-in-bottom relative">
      {showSuccess && <SuccessOverlay />}
      <h3 className="text-xl font-bold mb-4 text-text-primary">Create Worker Account</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="worker-name" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input type="text" id="worker-name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
          </div>
          <div>
            <label htmlFor="worker-email" className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input type="email" id="worker-email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
          </div>
        </div>
        <div>
          <label htmlFor="worker-password" className="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
          <input type="password" id="worker-password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
        </div>

        {error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</div>}
        {success && <div className="text-green-400 text-sm bg-green-500/10 p-2 rounded-lg">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80 disabled:opacity-50 flex items-center justify-center">
            {isLoading && <Spinner size="sm" />}
            <span className={isLoading ? 'ml-2' : ''}>Create Account</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface Worker {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  created_by: string | null;
}

const UserManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, created_at, is_active, created_by')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToOwner = async (workerId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to promote ${workerName} to Owner? This will give them full administrative access.`)) {
      return;
    }

    setPromotingUser(workerId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'owner' })
        .eq('id', workerId);

      if (error) throw error;
      await fetchWorkers(); // Refresh the list
      alert(`${workerName} has been promoted to Owner successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to promote user');
    } finally {
      setPromotingUser(null);
    }
  };

  const handleToggleStatus = async (workerId: string, currentStatus: boolean, workerName: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} ${workerName}'s account?`)) {
      return;
    }

    setTogglingStatus(workerId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', workerId);

      if (error) throw error;
      await fetchWorkers(); // Refresh the list
      alert(`${workerName}'s account has been ${action}d successfully!`);
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`);
    } finally {
      setTogglingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
        <div className="flex justify-center items-center h-32">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-text-primary">User Management</h3>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {workers.length === 0 ? (
        <p className="text-text-secondary text-center py-8">No workers found. Create some worker accounts to manage them here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Name</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Email</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Status</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Created</th>
                <th className="text-left py-3 px-2 text-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-border/30 hover:bg-white/5">
                  <td className="py-3 px-2 text-text-primary font-medium">{worker.display_name}</td>
                  <td className="py-3 px-2 text-text-secondary">{worker.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      worker.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{formatDate(worker.created_at)}</td>
                  <td className="py-3 px-2 space-x-2">
                    <button
                      onClick={() => handleToggleStatus(worker.id, worker.is_active, worker.display_name)}
                      disabled={togglingStatus === worker.id}
                      className={`px-3 py-1 text-sm rounded-lg transition disabled:opacity-50 flex items-center ${
                        worker.is_active
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {togglingStatus === worker.id && <Spinner size="sm" />}
                      <span className={togglingStatus === worker.id ? 'ml-2' : ''}>
                        {worker.is_active ? 'Deactivate' : 'Activate'}
                      </span>
                    </button>
                    <button
                      onClick={() => handlePromoteToOwner(worker.id, worker.display_name)}
                      disabled={promotingUser === worker.id}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center"
                    >
                      {promotingUser === worker.id && <Spinner size="sm" />}
                      <span className={promotingUser === worker.id ? 'ml-2' : ''}>
                        Promote to Owner
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BackupSection: React.FC = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupStatus(null);

    try {
      // Get all data for backup
      const [
        { data: products },
        { data: sales },
        { data: expenses },
        { data: notes },
        { data: userProfiles }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('user_profiles').select('*')
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        products,
        sales,
        expenses,
        notes,
        userProfiles
      };

      // Create and download the backup file
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `charnoks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setBackupStatus('Backup created and downloaded successfully!');
    } catch (err: any) {
      setBackupStatus(`Failed to create backup: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupStatus(null), 5000);
    }
  };

  return (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-text-primary">Data Backup</h3>
      <p className="text-text-secondary mb-4">
        Create a complete backup of your business data including sales, expenses, products, and user information.
      </p>

      {backupStatus && (
        <div className={`text-sm p-2 rounded-lg mb-4 ${backupStatus.includes('Failed')
            ? 'text-red-400 bg-red-500/10'
            : 'text-green-400 bg-green-500/10'
          }`}>
          {backupStatus}
        </div>
      )}

      <button
        onClick={handleCreateBackup}
        disabled={isCreatingBackup}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center"
      >
        {isCreatingBackup && <Spinner size="sm" />}
        <span className={isCreatingBackup ? 'ml-2' : ''}>
          {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
        </span>
      </button>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <header className="animate-bounce-in">
        <h1 className="text-4xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Configure your application and manage users.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <ThemeSelector />

        {user?.role === 'owner' && (
          <>
            <CreateWorkerForm />
            <UserManagement />
            <BackupSection />
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;