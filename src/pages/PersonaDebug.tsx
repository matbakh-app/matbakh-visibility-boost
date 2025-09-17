/**
 * Persona Debug Page - Following Task 6.4.4 Auth Debug Pattern
 * 
 * This page provides comprehensive debugging and testing functionality
 * for the Advanced Persona System, following the successful pattern
 * from AuthDebug.tsx that helped resolve the Auth System issues.
 */

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { PersonaType, UserBehavior } from '@/types/persona';
import { SafePersonaLoader, PersonaIndicator } from '@/components/SafePersonaLoader';
import { 
  AdaptiveContainer, 
  AdaptiveButton, 
  AdaptiveContent, 
  PersonaHeader,
  AdaptiveCard 
} from '@/components/persona/PersonaAdaptiveUI';
import { 
  User, 
  Settings, 
  Activity, 
  Clock, 
  Shield, 
  TrendingUp, 
  Building2,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';

export default function PersonaDebug() {
  const {
    currentPersona,
    confidence,
    isLoading,
    error,
    lastUpdated,
    isPersonaReady,
    detectPersona,
    overridePersona,
    resetPersona,
    trackBehavior,
    getPersonaConfig,
    getPersonaPreferences,
  } = usePersona();

  const [behaviorLog, setBehaviorLog] = useState<UserBehavior[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test behavior patterns for each persona
  const testBehaviors: Record<PersonaType, Partial<UserBehavior>> = {
    'Solo-Sarah': {
      decisionSpeed: 0.9, // Fast decisions
      deviceType: 'mobile',
      sessionDuration: 180000, // 3 minutes
      clickPatterns: [
        { elementType: 'button', elementId: 'quick-action', timestamp: new Date().toISOString(), context: 'dashboard' }
      ],
      informationConsumption: {
        preferredContentLength: 'short',
        readingSpeed: 300,
        comprehensionIndicators: {
          scrollBehavior: 'fast',
          returnVisits: 0,
          actionTaken: true,
        },
      },
    },
    'Bewahrer-Ben': {
      decisionSpeed: 0.3, // Slow, careful decisions
      deviceType: 'desktop',
      sessionDuration: 900000, // 15 minutes
      clickPatterns: [
        { elementType: 'link', elementId: 'help-documentation', timestamp: new Date().toISOString(), context: 'onboarding' }
      ],
      informationConsumption: {
        preferredContentLength: 'long',
        readingSpeed: 150,
        comprehensionIndicators: {
          scrollBehavior: 'slow',
          returnVisits: 3,
          actionTaken: false,
        },
      },
    },
    'Wachstums-Walter': {
      decisionSpeed: 0.7, // Moderate, strategic decisions
      deviceType: 'desktop',
      sessionDuration: 600000, // 10 minutes
      clickPatterns: [
        { elementType: 'chart', elementId: 'growth-analytics', timestamp: new Date().toISOString(), context: 'analytics' }
      ],
      informationConsumption: {
        preferredContentLength: 'medium',
        readingSpeed: 250,
        comprehensionIndicators: {
          scrollBehavior: 'moderate',
          returnVisits: 1,
          actionTaken: true,
        },
      },
    },
    'Ketten-Katrin': {
      decisionSpeed: 0.6, // Strategic, enterprise decisions
      deviceType: 'desktop',
      sessionDuration: 1200000, // 20 minutes
      clickPatterns: [
        { elementType: 'table', elementId: 'multi-location-data', timestamp: new Date().toISOString(), context: 'enterprise' }
      ],
      informationConsumption: {
        preferredContentLength: 'long',
        readingSpeed: 200,
        comprehensionIndicators: {
          scrollBehavior: 'moderate',
          returnVisits: 2,
          actionTaken: true,
        },
      },
    },
  };

  // Test persona detection with specific behavior
  const testPersonaDetection = async (targetPersona: PersonaType) => {
    const testBehavior = testBehaviors[targetPersona];
    
    try {
      await detectPersona({
        sessionId: `test-${Date.now()}`,
        userId: 'debug-user',
        timestamp: new Date().toISOString(),
        clickPatterns: testBehavior.clickPatterns || [],
        navigationFlow: [],
        timeSpent: {
          totalSession: testBehavior.sessionDuration || 0,
          perPage: {},
          activeTime: (testBehavior.sessionDuration || 0) * 0.8,
          idleTime: (testBehavior.sessionDuration || 0) * 0.2,
        },
        contentInteractions: [],
        featureUsage: [],
        decisionSpeed: testBehavior.decisionSpeed || 0.5,
        informationConsumption: testBehavior.informationConsumption || {
          preferredContentLength: 'medium',
          readingSpeed: 200,
          comprehensionIndicators: {
            scrollBehavior: 'moderate',
            returnVisits: 0,
            actionTaken: false,
          },
        },
        deviceType: testBehavior.deviceType || 'desktop',
        sessionDuration: testBehavior.sessionDuration || 0,
        pageViews: 1,
      });

      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        targetPersona,
        detectedPersona: currentPersona,
        confidence,
        success: currentPersona === targetPersona,
      }]);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  // Run all persona tests
  const runAllTests = async () => {
    setTestResults([]);
    const personas: PersonaType[] = ['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin'];
    
    for (const persona of personas) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
      await testPersonaDetection(persona);
    }
  };

  // Track behavior for debugging
  const trackTestBehavior = (behaviorType: string) => {
    const behavior: Partial<UserBehavior> = {
      clickPatterns: [
        {
          elementType: 'button',
          elementId: `debug-${behaviorType}`,
          timestamp: new Date().toISOString(),
          context: 'debug-page',
        }
      ],
      decisionSpeed: Math.random(),
      sessionDuration: Date.now() % 1000000,
    };

    trackBehavior(behavior);
    setBehaviorLog(prev => [...prev.slice(-9), behavior as UserBehavior]);
  };

  const config = getPersonaConfig();
  const preferences = getPersonaPreferences();

  return (
    <div className="persona-debug-page min-h-screen bg-gray-50 py-8">
      <AdaptiveContainer>
        <PersonaHeader
          title="Advanced Persona System Debug"
          subtitle="Test and debug persona detection functionality"
          showPersonaIndicator={true}
        />

        {/* Current Persona Status */}
        <AdaptiveCard title="Current Persona Status" priority="high">
          <SafePersonaLoader
            isLoading={isLoading}
            error={error}
            currentPersona={currentPersona}
            confidence={confidence}
            onRetry={() => window.location.reload()}
            onOverride={overridePersona}
            showDebugInfo={true}
          />

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Ready:</strong> {isPersonaReady ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Last Updated:</strong> {lastUpdated?.toLocaleString() || 'Never'}
            </div>
            <div>
              <strong>Confidence:</strong> {(confidence * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Override Active:</strong> {localStorage.getItem('matbakh_admin_persona_override') ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </AdaptiveCard>

        {/* Persona Configuration */}
        <AdaptiveCard title="Persona Configuration">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Config</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Name:</strong> {config.name}</div>
                <div><strong>Description:</strong> {config.description}</div>
                <div><strong>Content Length:</strong> {config.uiPreferences.contentLength}</div>
                <div><strong>Visual Style:</strong> {config.uiPreferences.visualStyle}</div>
                <div><strong>Interaction Style:</strong> {config.uiPreferences.interactionStyle}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Detailed Analytics:</strong> {preferences.showDetailedAnalytics ? '✅' : '❌'}</div>
                <div><strong>Quick Actions:</strong> {preferences.preferQuickActions ? '✅' : '❌'}</div>
                <div><strong>Needs Guidance:</strong> {preferences.needsGuidance ? '✅' : '❌'}</div>
                <div><strong>Advanced Features:</strong> {preferences.wantsAdvancedFeatures ? '✅' : '❌'}</div>
                <div><strong>Time Constraints:</strong> {preferences.timeConstraints}</div>
              </div>
            </div>
          </div>
        </AdaptiveCard>

        {/* Manual Controls */}
        <AdaptiveCard title="Manual Controls">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Persona Override</h4>
              <div className="flex flex-wrap gap-2">
                <AdaptiveButton onClick={() => overridePersona('Solo-Sarah')} size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Solo Sarah
                </AdaptiveButton>
                <AdaptiveButton onClick={() => overridePersona('Bewahrer-Ben')} size="sm">
                  <Shield className="h-4 w-4 mr-1" />
                  Bewahrer Ben
                </AdaptiveButton>
                <AdaptiveButton onClick={() => overridePersona('Wachstums-Walter')} size="sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Wachstums Walter
                </AdaptiveButton>
                <AdaptiveButton onClick={() => overridePersona('Ketten-Katrin')} size="sm">
                  <Building2 className="h-4 w-4 mr-1" />
                  Ketten Katrin
                </AdaptiveButton>
              </div>
            </div>

            <div className="flex space-x-2">
              <AdaptiveButton onClick={resetPersona} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset Persona
              </AdaptiveButton>
              <AdaptiveButton onClick={() => window.location.reload()} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All Data
              </AdaptiveButton>
            </div>
          </div>
        </AdaptiveCard>

        {/* Behavior Tracking Tests */}
        <AdaptiveCard title="Behavior Tracking Tests">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Track Test Behaviors</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => trackTestBehavior('fast-click')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Fast Click
                </button>
                <button
                  onClick={() => trackTestBehavior('slow-scroll')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  Slow Scroll
                </button>
                <button
                  onClick={() => trackTestBehavior('analytics-view')}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                >
                  Analytics View
                </button>
                <button
                  onClick={() => trackTestBehavior('enterprise-action')}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                >
                  Enterprise Action
                </button>
              </div>
            </div>

            {behaviorLog.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Behavior Log</h4>
                <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                  {behaviorLog.map((behavior, index) => (
                    <div key={index} className="mb-1">
                      {behavior.timestamp}: {behavior.clickPatterns?.[0]?.elementId || 'Unknown action'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AdaptiveCard>

        {/* Automated Testing */}
        <AdaptiveCard title="Automated Testing">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <AdaptiveButton onClick={runAllTests} size="sm">
                <Activity className="h-4 w-4 mr-1" />
                Run All Tests
              </AdaptiveButton>
              <AdaptiveButton onClick={() => setTestResults([])} variant="outline" size="sm">
                Clear Results
              </AdaptiveButton>
            </div>

            {testResults.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Test Results</h4>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          Target: {result.targetPersona} → Detected: {result.detectedPersona}
                        </span>
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? '✅' : '❌'} {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AdaptiveCard>

        {/* Adaptive UI Demo */}
        <AdaptiveCard title="Adaptive UI Demo">
          <div className="space-y-4">
            <AdaptiveContent
              shortVersion={
                <p className="text-sm">Quick summary for busy users.</p>
              }
              mediumVersion={
                <p className="text-sm">
                  Moderate detail explanation with key points for balanced users who want some context.
                </p>
              }
              longVersion={
                <div className="text-sm space-y-2">
                  <p>
                    Comprehensive explanation with full details, background information, and thorough context.
                  </p>
                  <p>
                    This version includes additional explanations, examples, and detailed guidance for users
                    who prefer complete information before making decisions.
                  </p>
                </div>
              }
            />

            <div className="flex space-x-2">
              <AdaptiveButton size="sm">Primary Action</AdaptiveButton>
              <AdaptiveButton variant="secondary" size="sm">Secondary</AdaptiveButton>
              <AdaptiveButton variant="outline" size="sm">Outline</AdaptiveButton>
            </div>
          </div>
        </AdaptiveCard>

        {/* System Information */}
        <AdaptiveCard title="System Information">
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Screen Size:</strong> {window.innerWidth}x{window.innerHeight}</div>
            <div><strong>Device Type:</strong> {window.innerWidth < 768 ? 'Mobile' : 'Desktop'}</div>
            <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
            <div><strong>Session Storage:</strong> {sessionStorage.length} items</div>
            <div><strong>Local Storage:</strong> {localStorage.length} items</div>
          </div>
        </AdaptiveCard>
      </AdaptiveContainer>
    </div>
  );
}