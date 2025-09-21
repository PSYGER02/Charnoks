import React, { useState, useEffect } from 'react';
import { dataDeduplicationService } from '../../services/dataDeduplicationService';
import { offlineFirstDataService } from '../../services/offlineFirstDataService';
import Spinner from './Spinner';

interface DataStats {
  expenses: {
    total: number;
    active: number;
    duplicateGroups: number;
    pending: number;
  };
  sales: {
    total: number;
    active: number;
    duplicateGroups: number;
    pending: number;
  };
}

const OfflineDataStatus: React.FC = () => {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const statsData = await dataDeduplicationService.getDataQualityStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setCleanupResult(null);
    
    try {
      const result = await dataDeduplicationService.cleanAllDuplicates();
      setCleanupResult(result.summary);
      // Reload stats after cleanup
      await loadStats();
    } catch (error) {
      console.error('Failed to clean duplicates:', error);
      setCleanupResult('Failed to clean duplicates. Please try again.');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const forceRefresh = async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        await offlineFirstDataService.forceRefresh();
        await loadStats();
        setCleanupResult('Data refreshed from server successfully!');
      } else {
        setCleanupResult('Cannot refresh: device is offline');
      }
    } catch (error) {
      console.error('Failed to force refresh:', error);
      setCleanupResult('Failed to refresh data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Spinner size="sm" />
          <span className="text-text-secondary">Loading offline data status...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <div className="text-text-secondary">
          Unable to load data statistics. IndexedDB may not be available.
        </div>
      </div>
    );
  }

  const hasIssues = stats.expenses.duplicateGroups > 0 || stats.sales.duplicateGroups > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          📊 Offline Data Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expenses Stats */}
          <div className="bg-black/20 rounded-lg p-3">
            <h4 className="font-medium text-text-primary mb-2">💰 Expenses</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total:</span>
                <span className="text-text-primary">{stats.expenses.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active:</span>
                <span className="text-text-primary">{stats.expenses.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pending Sync:</span>
                <span className={stats.expenses.pending > 0 ? "text-yellow-400" : "text-text-primary"}>
                  {stats.expenses.pending}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Duplicates:</span>
                <span className={stats.expenses.duplicateGroups > 0 ? "text-red-400" : "text-green-400"}>
                  {stats.expenses.duplicateGroups}
                </span>
              </div>
            </div>
          </div>

          {/* Sales Stats */}
          <div className="bg-black/20 rounded-lg p-3">
            <h4 className="font-medium text-text-primary mb-2">📈 Sales</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total:</span>
                <span className="text-text-primary">{stats.sales.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active:</span>
                <span className="text-text-primary">{stats.sales.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pending Sync:</span>
                <span className={stats.sales.pending > 0 ? "text-yellow-400" : "text-text-primary"}>
                  {stats.sales.pending}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Duplicates:</span>
                <span className={stats.sales.duplicateGroups > 0 ? "text-red-400" : "text-green-400"}>
                  {stats.sales.duplicateGroups}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            {isLoading ? <Spinner size="sm" /> : '🔄 Refresh Stats'}
          </button>

          {hasIssues && (
            <button
              onClick={cleanDuplicates}
              disabled={isCleaningDuplicates}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              {isCleaningDuplicates ? <Spinner size="sm" /> : '🧹 Clean Duplicates'}
            </button>
          )}

          {navigator.onLine && (
            <button
              onClick={forceRefresh}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              ☁️ Refresh from Server
            </button>
          )}
        </div>

        {/* Status Messages */}
        {cleanupResult && (
          <div className={`mt-3 p-3 rounded text-sm ${
            cleanupResult.includes('Failed') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
          }`}>
            {cleanupResult}
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-3 text-xs text-text-secondary">
          Status: {navigator.onLine ? '🟢 Online' : '🔴 Offline'} • 
          Dashboard loads from IndexedDB first for instant response
        </div>
      </div>
    </div>
  );
};

export default OfflineDataStatus;