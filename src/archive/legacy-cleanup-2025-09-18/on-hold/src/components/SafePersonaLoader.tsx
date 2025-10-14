/**
 * Safe Persona Loader Component - Following Task 6.4.4 Pattern
 * 
 * This component provides safe loading and error handling for persona detection,
 * following the successful pattern from SafeAuthLoader.tsx that resolved
 * the Provider Architecture issues in Task 6.4.4.
 */

import React from 'react';
import { AlertCircle, User, Settings, Loader2 } from 'lucide-react';
import { PersonaType } from '@/types/persona';

interface SafePersonaLoaderProps {
  isLoading: boolean;
  error: string | null;
  currentPersona: PersonaType;
  confidence: number;
  onRetry?: () => void;
  onOverride?: (persona: PersonaType) => void;
  showDebugInfo?: boolean;
  className?: string;
}

/**
 * Safe Persona Loader with comprehensive error handling and fallback UI
 * 
 * Features:
 * - Loading states with skeleton UI
 * - Error states with retry functionality
 * - Persona display with confidence indicators
 * - Admin override controls for testing
 * - Debug information for development
 */
export function SafePersonaLoader({
  isLoading,
  error,
  currentPersona,
  confidence,
  onRetry,
  onOverride,
  showDebugInfo = false,
  className = '',
}: SafePersonaLoaderProps) {
  
  // Persona display configuration
  const personaConfig = {
    'Solo-Sarah': {
      name: 'Solo Sarah',
      description: 'Time-pressed single restaurant owner',
      color: 'bg-blue-100 text-blue-800',
      icon: '⚡',
    },
    'Bewahrer-Ben': {
      name: 'Bewahrer Ben',
      description: 'Security-focused traditional owner',
      color: 'bg-green-100 text-green-800',
      icon: '🛡️',
    },
    'Wachstums-Walter': {
      name: 'Wachstums Walter',
      description: 'Growth-oriented expansion-minded owner',
      color: 'bg-purple-100 text-purple-800',
      icon: '📈',
    },
    'Ketten-Katrin': {
      name: 'Ketten Katrin',
      description: 'Enterprise/chain management',
      color: 'bg-orange-100 text-orange-800',
      icon: '🏢',
    },
  };

  const config = personaConfig[currentPersona];

  // Loading state
  if (isLoading) {
    return (
      <div className={`persona-loader loading ${className}`}>
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className={`persona-loader error ${className}`}>
        <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">
              Persona Detection Failed
            </h4>
            <p className="text-sm text-red-600 mt-1">
              {error}
            </p>
            <p className="text-xs text-red-500 mt-2">
              Using fallback persona: {config.name}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Success state with persona display
  return (
    <div className={`persona-loader success ${className}`}>
      <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border shadow-sm">
        {/* Persona Icon and Info */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${config.color}`}>
          <span className="text-lg">{config.icon}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900">
              {config.name}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {config.description}
          </p>
        </div>

        {/* Admin Controls */}
        {showDebugInfo && onOverride && (
          <div className="flex items-center space-x-2">
            <select
              onChange={(e) => onOverride(e.target.value as PersonaType)}
              value={currentPersona}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="Solo-Sarah">Solo Sarah</option>
              <option value="Bewahrer-Ben">Bewahrer Ben</option>
              <option value="Wachstums-Walter">Wachstums Walter</option>
              <option value="Ketten-Katrin">Ketten Katrin</option>
            </select>
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Persona:</strong> {currentPersona}
            </div>
            <div>
              <strong>Confidence:</strong> {(confidence * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Status:</strong> {confidence > 0.7 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low'}
            </div>
            <div>
              <strong>Source:</strong> {localStorage.getItem('matbakh_admin_persona_override') ? 'Override' : 'Detection'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Persona Indicator for use in headers/navigation
 */
export function PersonaIndicator({
  currentPersona,
  confidence,
  className = '',
}: {
  currentPersona: PersonaType;
  confidence: number;
  className?: string;
}) {
  const personaConfig = {
    'Solo-Sarah': { icon: '⚡', color: 'text-blue-600' },
    'Bewahrer-Ben': { icon: '🛡️', color: 'text-green-600' },
    'Wachstums-Walter': { icon: '📈', color: 'text-purple-600' },
    'Ketten-Katrin': { icon: '🏢', color: 'text-orange-600' },
  };

  const config = personaConfig[currentPersona];

  return (
    <div className={`persona-indicator flex items-center space-x-1 ${className}`}>
      <span className="text-sm">{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>
        {currentPersona.split('-')[0]}
      </span>
      {confidence < 0.7 && (
        <span className="text-xs text-gray-400">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </div>
  );
}

/**
 * Persona Loading Skeleton for use during detection
 */
export function PersonaLoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`persona-skeleton ${className}`}>
      <div className="flex items-center space-x-3 p-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    </div>
  );
}