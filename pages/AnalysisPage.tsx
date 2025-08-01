
import React, { useState } from 'react';

// New analysis mode components
import AnalysisHome from '../components/analysis/AnalysisHome';
import AllWorkersOverview from '../components/analysis/AllWorkersOverview';
import CompareWorkers from '../components/analysis/CompareWorkers';
import WorkerInsight from '../components/analysis/WorkerInsight';
import AIPrediction from '../components/analysis/AIPrediction';

// Services
import { getSales, getExpenses, getWorkersList } from '../services/firebaseService';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import Spinner from '../components/ui/Spinner';

export type AnalysisMode = 'home' | 'all-workers' | 'compare-workers' | 'worker-insight' | 'ai-prediction';

const AnalysisPage: React.FC = () => {
    const [mode, setMode] = useState<AnalysisMode>('home');

    // Load data with enhanced error handling
    const { loadingState: salesState } = useEnhancedDataLoading(
        () => getSales(100),
        {
            cacheKey: 'analysis-sales',
            cacheDuration: 5 * 60 * 1000, // 5 minutes
            maxRetries: 2
        }
    );

    const { loadingState: expensesState } = useEnhancedDataLoading(
        () => getExpenses(100),
        {
            cacheKey: 'analysis-expenses',
            cacheDuration: 5 * 60 * 1000,
            maxRetries: 2
        }
    );

    const { loadingState: workersState } = useEnhancedDataLoading(
        () => getWorkersList(),
        {
            cacheKey: 'analysis-workers',
            cacheDuration: 10 * 60 * 1000, // 10 minutes
            maxRetries: 2
        }
    );

    // Get data or use empty arrays
    const sales = salesState.data || [];
    const expenses = expensesState.data || [];
    const workers = workersState.data || [];
    const products = []; // Will be loaded separately if needed

    const isLoading = (salesState.loading && !salesState.data) || 
                     (expensesState.loading && !expensesState.data) || 
                     (workersState.loading && !workersState.data);

    const hasError = (salesState.error && !salesState.data) || 
                    (expensesState.error && !expensesState.data) || 
                    (workersState.error && !workersState.data);

    const renderContent = () => {
        if (isLoading && mode !== 'home') {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            );
        }

        switch (mode) {
            case 'all-workers':
                return <AllWorkersOverview sales={sales} expenses={expenses} hasError={hasError} />;
            case 'compare-workers':
                return <CompareWorkers sales={sales} expenses={expenses} workers={workers} hasError={hasError} />;
            case 'worker-insight':
                return <WorkerInsight sales={sales} expenses={expenses} workers={workers} products={products} hasError={hasError} />;
            case 'ai-prediction':
                return <AIPrediction sales={sales} hasError={hasError} />;
            case 'home':
            default:
                return <AnalysisHome setMode={setMode} />;
        }
    };

    const getPageTitle = () => {
        switch (mode) {
            case 'all-workers': return "All Workers Overview";
            case 'compare-workers': return "Compare Workers";
            case 'worker-insight': return "Worker Insight";
            case 'ai-prediction': return "AI-Powered Predictions";
            case 'home':
            default:
                return "Analysis Center";
        }
    };

    return (
        <div className="space-y-6">
            {/* Error banner for data loading issues (non-blocking) */}
            {hasError && mode !== 'home' && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="text-yellow-400 mr-3">⚠️</span>
                        <div>
                            <h3 className="text-yellow-300 font-medium">Limited data available</h3>
                            <p className="text-yellow-400/80 text-sm">
                                Some data couldn't be loaded. Analysis will show available information only.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header className="animate-bounce-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">{getPageTitle()}</h1>
                        <p className="text-text-secondary mt-1">
                            {mode === 'home' ? 'Select an analysis mode to begin.' : 
                             sales.length === 0 && expenses.length === 0 ? 'Start recording sales and expenses to see analysis.' :
                             'Dive deep into your business data.'}
                        </p>
                    </div>
                    {mode !== 'home' && (
                        <button
                            onClick={() => setMode('home')}
                            className="bg-white/10 hover:bg-white/20 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Modes
                        </button>
                    )}
                </div>
            </header>
            
            <div className="animate-slide-in-bottom">
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalysisPage;
