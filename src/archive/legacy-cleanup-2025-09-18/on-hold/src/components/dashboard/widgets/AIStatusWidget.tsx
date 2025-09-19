/**
 * AI Status Widget - Shows real-time AI operation status and service health
 * Displays active operations, service availability, and system health
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  RefreshCw,
  Settings,
  TrendingUp,
  Server
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';

interface AIStatusWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const AIStatusWidget: React.FC<AIStatusWidgetProps> = ({
  compactMode = false,
  persona = null,
  beta = false
}) => {
  const { t } = useTranslation('dashboard');
  const {
    portfolio,
    isLoading,
    activeOperations,
    getAvailableServices,
    isServiceHealthy,
    refreshServices
  } = useAIServices();

  const availableServices = getAvailableServices();
  const runningOperations = activeOperations.filter(op => op.status === 'running');
  const completedOperations = activeOperations.filter(op => op.status === 'completed');

  const getServiceStatusIcon = (status: string, healthScore: number) => {
    if (status === 'active' && healthScore > 80) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status === 'active' && healthScore > 50) {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    } else if (status === 'maintenance') {
      return <Settings className="w-4 h-4 text-blue-600" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Activity className="w-4 h-4" />;
      case 'content': return <Zap className="w-4 h-4" />;
      case 'recommendations': return <TrendingUp className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) return `vor ${diffSecs}s`;
    if (diffMins < 60) return `vor ${diffMins}m`;
    return `vor ${Math.floor(diffMins / 60)}h`;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>KI-Status</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>KI-Status</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshServices}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {portfolio && portfolio.activeServices > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-sm">
                {portfolio ? `${portfolio.activeServices} Services aktiv` : 'Keine Services'}
              </p>
              <p className="text-xs text-gray-500">
                {portfolio ? `Gesundheit: ${portfolio.healthScore}%` : 'Status unbekannt'}
              </p>
            </div>
          </div>
          {portfolio && portfolio.healthScore && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {portfolio.healthScore}%
              </div>
              <div className="text-xs text-gray-500">Health</div>
            </div>
          )}
        </div>

        {/* Active Operations */}
        {runningOperations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Aktive Operationen ({runningOperations.length})</span>
            </h4>
            {runningOperations.slice(0, compactMode ? 2 : 3).map((op) => (
              <div key={op.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getOperationIcon(op.type)}
                    <span className="text-sm font-medium">{op.message}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {op.progress}%
                  </Badge>
                </div>
                <Progress value={op.progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Gestartet: {formatTimeAgo(op.startTime)}</span>
                  {op.estimatedCompletion && (
                    <span>ETA: {op.estimatedCompletion.toLocaleTimeString('de-DE')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Status */}
        {availableServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Services ({availableServices.length})</span>
            </h4>
            <div className="space-y-2">
              {availableServices.slice(0, compactMode ? 2 : 4).map((service) => (
                <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    {getServiceStatusIcon(service.status, service.healthScore)}
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.capabilities.filter(c => c.enabled).length} Features
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={service.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {service.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {service.healthScore}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completions */}
        {completedOperations.length > 0 && !compactMode && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Kürzlich abgeschlossen</span>
            </h4>
            <div className="space-y-1">
              {completedOperations.slice(0, 3).map((op) => (
                <div key={op.id} className="flex items-center justify-between text-sm p-2 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getOperationIcon(op.type)}
                    <span className="text-green-800">{op.message}</span>
                  </div>
                  <span className="text-xs text-green-600">
                    {formatTimeAgo(op.startTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {availableServices.length === 0 && runningOperations.length === 0 && (
          <div className="text-center py-6">
            <Server className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">
              Keine KI-Services verfügbar
            </p>
            <p className="text-xs text-gray-400">
              Aktivieren Sie AI-Features für erweiterte Funktionen
            </p>
          </div>
        )}

        {/* Persona Context */}
        {persona && !compactMode && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Aktive Persona:</span>
              <Badge variant="outline">{persona}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIStatusWidget;