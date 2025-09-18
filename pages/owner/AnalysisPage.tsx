
import React, { useState, useEffect } from 'react';

// New analysis mode components
import AnalysisHome from '../../components/analysis/AnalysisHome';
import AllWorkersOverview from '../../components/analysis/AllWorkersOverview';
import CompareWorkers from '../../components/analysis/CompareWorkers';
import WorkerInsight from '../../components/analysis/WorkerInsight';
import AIPrediction from '../../components/analysis/AIPrediction';

// Services
import { getSalesOfflineFirst, getExpensesOfflineFirst, getWorkersOfflineFirst } from '../../services/offlineFirstDataService';
import Spinner from '../../components/ui/Spinner';

export type AnalysisMode = 'home' | 'all-workers' | 'compare-workers' | 'worker-insight' | 'ai-prediction';

const AnalysisPage: React.FC = () => {
    const [mode, setMode] = useState<AnalysisMode>('home');
    const [sales, setSales] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const products = []; // Will be loaded separately if needed

    // Load data when switching to analysis modes
    useEffect(() => {
        const loadData = async () => {
            if (mode === 'home' || hasLoaded) return;
            
            setIsLoading(true);
            setHasLoaded(true);
            
            try {
                const [salesData, expensesData, workersData] = await Promise.all([
                    getSalesOfflineFirst(50),
                    getExpensesOfflineFirst(50),
                    getWorkersOfflineFirst()
                ]);
                setSales(salesData);
                setExpenses(expensesData);
                setWorkers(workersData);
                setHasError(false);
            } catch (error) {
                console.warn('Analysis data not loaded:', error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, [mode, hasLoaded]);

    const renderContent = () => {
        return (
            <div>
                {/* Loading indicator */}
                {isLoading && mode !== 'home' && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center text-sm">
                            <Spinner size="sm" className="mr-2" />
                            <span className="text-blue-300">Loading analysis data...</span>
                        </div>
                    </div>
                )}
                
                {/* Content */}
                {(() => {
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
                })()
                }
            </div>
        )
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
                             !hasLoaded ? 'Loading analysis data...' :
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
