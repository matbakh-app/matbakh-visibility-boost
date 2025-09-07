/**
 * Adaptive AI Dashboard - Demonstrates the adaptive UI system
 * Shows how the dashboard adjusts based on available AI services and user persona
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Zap, 
  Eye, 
  RefreshCw,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AdaptiveDashboardGrid from '@/components/dashboard/AdaptiveDashboardGrid';
import { useAIServices } from '@/hooks/useAIServices';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const AdaptiveAIDashboard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const [compactMode, setCompactMode] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const { hasFeature, hasRole, access } = useFeatureAccess();
  const {
    portfolio,
    isLoading,
    error,
    currentPersona,
    getAvailableServices,
    refreshServices,
    activeOperations
  } = useAIServices();

  const availableServices = getAvailableServices();
  const hasAnyAIFeatures = hasFeature('ai_analysis') || hasFeature('ai_content') || hasFeature('premium_features');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <span>Adaptive AI Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Intelligentes Dashboard, das sich an verfügbare KI-Services und Ihre Persona anpasst
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Debug Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshServices}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Services aktualisieren
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Services</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolio ? portfolio.activeServices : 0}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  portfolio && portfolio.activeServices > 0 
                    ? 'bg-green-100' 
                    : 'bg-gray-100'
                }`}>
                  {portfolio && portfolio.activeServices > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {portfolio ? `${portfolio.totalCapabilities} Features verfügbar` : 'Lade...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktive Persona</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentPersona || 'Nicht gewählt'}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-purple-100">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bestimmt verfügbare Features
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolio ? `${portfolio.healthScore}%` : '--'}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  portfolio && portfolio.healthScore > 80 
                    ? 'bg-green-100' 
                    : portfolio && portfolio.healthScore > 50
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    portfolio && portfolio.healthScore > 80 
                      ? 'text-green-600' 
                      : portfolio && portfolio.healthScore > 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Durchschnittliche Service-Gesundheit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Dashboard-Einstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Kompakt-Modus</label>
                  <p className="text-xs text-gray-500">Reduzierte Widget-Größen</p>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Persona-Auswahl</label>
                  <p className="text-xs text-gray-500">Persona-Widget anzeigen</p>
                </div>
                <Switch
                  checked={showPersonaSelector}
                  onCheckedChange={setShowPersonaSelector}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Debug-Modus</label>
                  <p className="text-xs text-gray-500">Entwickler-Informationen</p>
                </div>
                <Switch
                  checked={showDebugInfo}
                  onCheckedChange={setShowDebugInfo}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {showDebugInfo && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span>Debug Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">User Access</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <Badge variant="outline">{access.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Analysis:</span>
                      <Badge variant={hasFeature('ai_analysis') ? 'default' : 'secondary'}>
                        {hasFeature('ai_analysis') ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Content:</span>
                      <Badge variant={hasFeature('ai_content') ? 'default' : 'secondary'}>
                        {hasFeature('ai_content') ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Features:</span>
                      <Badge variant={hasFeature('premium_features') ? 'default' : 'secondary'}>
                        {hasFeature('premium_features') ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Available Services</h4>
                  <div className="space-y-1 text-sm">
                    {availableServices.length > 0 ? (
                      availableServices.map(service => (
                        <div key={service.id} className="flex justify-between">
                          <span>{service.name}:</span>
                          <Badge 
                            variant={service.status === 'active' ? 'default' : 'secondary'}
                          >
                            {service.status} ({service.healthScore}%)
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No services available</p>
                    )}
                  </div>
                </div>
              </div>

              {activeOperations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Active Operations</h4>
                  <div className="space-y-2">
                    {activeOperations.map(op => (
                      <div key={op.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                        <span>{op.message}</span>
                        <Badge variant="outline">{op.status} - {op.progress}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feature Access Warning */}
        {!hasAnyAIFeatures && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Eingeschränkte AI-Features</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Sie haben derzeit keinen Zugriff auf AI-Features. Kontaktieren Sie Ihren Administrator 
                    oder upgraden Sie Ihr Konto, um die volle Funktionalität zu nutzen.
                  </p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      Upgrade anfragen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Adaptive Dashboard Grid */}
      <AdaptiveDashboardGrid
        userRole={access.role as 'admin' | 'manager' | 'user'}
        compactMode={compactMode}
        showPersonaSelector={showPersonaSelector}
      />

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Dashboard passt sich automatisch an verfügbare AI-Services und Ihre gewählte Persona an.
          {portfolio && (
            <span className="ml-2">
              Letzte Aktualisierung: {portfolio.lastUpdated.toLocaleString('de-DE')}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdaptiveAIDashboard;