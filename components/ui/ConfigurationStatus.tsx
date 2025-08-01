/**
 * Configuration Status Component
 * Displays system configuration status and provides setup guidance
 */

import React, { useState, useEffect } from 'react';
import { ConfigValidator, ConfigValidationResult, SystemConfig } from '../../utils/configValidator';

interface ConfigurationStatusProps {
  onConfigurationChange?: (isValid: boolean) => void;
  showDetails?: boolean;
}

const ConfigurationStatus: React.FC<ConfigurationStatusProps> = ({
  onConfigurationChange,
  showDetails = false
}) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const [systemConfig, validationResult] = await Promise.all([
        ConfigValidator.getSystemConfig(),
        Promise.resolve(ConfigValidator.validateAll())
      ]);

      // Test actual connections
      const [firebaseConnected, geminiWorking] = await Promise.all([
        ConfigValidator.testFirebaseConnection(),
        ConfigValidator.testGeminiConnection()
      ]);

      systemConfig.firebase.connected = firebaseConnected;
      systemConfig.gemini.working = geminiWorking;

      setConfig(systemConfig);
      setValidation(validationResult);
      
      if (onConfigurationChange) {
        onConfigurationChange(validationResult.isValid && firebaseConnected);
      }
    } catch (error) {
      console.error('Configuration check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
          <span className="text-text-secondary">Checking system configuration...</span>
        </div>
      </div>
    );
  }

  if (!config || !validation) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-300">Failed to check system configuration</p>
      </div>
    );
  }

  const getStatusColor = (isValid: boolean, isConnected?: boolean) => {
    if (!isValid) return 'text-red-400';
    if (isConnected === false) return 'text-yellow-400';
    if (isConnected === true) return 'text-green-400';
    return 'text-blue-400';
  };

  const getStatusIcon = (isValid: boolean, isConnected?: boolean) => {
    if (!isValid) return '❌';
    if (isConnected === false) return '⚠️';
    if (isConnected === true) return '✅';
    return '🔧';
  };

  const hasIssues = !validation.isValid || !config.firebase.connected;

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className={`rounded-lg p-4 border ${
        hasIssues 
          ? 'bg-red-900/20 border-red-500/30' 
          : 'bg-green-900/20 border-green-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {hasIssues ? '⚠️' : '✅'}
            </span>
            <div>
              <h3 className={`font-semibold ${hasIssues ? 'text-red-300' : 'text-green-300'}`}>
                System Configuration
              </h3>
              <p className={`text-sm ${hasIssues ? 'text-red-400/80' : 'text-green-400/80'}`}>
                {hasIssues ? 'Configuration issues detected' : 'All systems operational'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={checkConfiguration}
              className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors"
            >
              Refresh
            </button>
            {hasIssues && (
              <button
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded text-sm hover:bg-blue-600/30 transition-colors"
              >
                Setup Guide
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Service Status */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firebase Status */}
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text-primary">Firebase</h4>
              <span className="text-lg">
                {getStatusIcon(config.firebase.configured, config.firebase.connected)}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Configuration:</span>
                <span className={getStatusColor(config.firebase.configured)}>
                  {config.firebase.configured ? 'Valid' : 'Invalid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Connection:</span>
                <span className={getStatusColor(true, config.firebase.connected)}>
                  {config.firebase.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Gemini AI Status */}
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text-primary">Gemini AI</h4>
              <span className="text-lg">
                {getStatusIcon(config.gemini.configured, config.gemini.working)}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Configuration:</span>
                <span className={getStatusColor(config.gemini.configured)}>
                  {config.gemini.configured ? 'Valid' : 'Invalid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">API Status:</span>
                <span className={getStatusColor(true, config.gemini.working)}>
                  {config.gemini.working ? 'Working' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      {showSetupGuide && hasIssues && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="font-medium text-blue-300 mb-3">Setup Instructions</h4>
          
          {validation.missingKeys.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-blue-200 mb-2">Missing Configuration:</h5>
              <ul className="text-sm text-blue-300/80 space-y-1">
                {validation.missingKeys.map(key => (
                  <li key={key} className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.invalidKeys.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-blue-200 mb-2">Invalid Configuration:</h5>
              <ul className="text-sm text-blue-300/80 space-y-1">
                {validation.invalidKeys.map(key => (
                  <li key={key} className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.suggestions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-blue-200 mb-2">Recommendations:</h5>
              <ul className="text-sm text-blue-300/80 space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigurationStatus;