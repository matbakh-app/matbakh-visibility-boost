/**
 * Performance Monitoring Widget
 * 
 * Compact performance monitoring widget that can be embedded
 * in any page to show real-time performance status.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  TrendingDown, 
  TrendingUp 
} from 'lucide-react';
import { usePerformanceMonitoringContext } from './PerformanceMonitoringProvider';

interface PerformanceWidgetProps {
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({
  className = '',
  compact = false,
  showDetails = false
}) => {
  const {
    summary,
    alerts,
    isInitialized,
    healthScore,
    isHealthy,
    lastUpdate
  } = usePerformanceMonitoringContext();

  const [expanded, setExpanded] = useState(showDetails);

  if (!isInitialized) {
    return (
      <Card className={`${className} ${compact ? 'p-2' : ''}`}>
        <CardContent className={compact ? 'p-2' : 'p-4'}>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
            <span className="text-sm text-muted-foreground">Initializing performance monitoring...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 70) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getScoreIcon(healthScore)}
        <span className={`text-sm font-medium ${getScoreColor(healthScore)}`}>
          {healthScore}/100
        </span>
        {criticalAlerts > 0 && (
          <Badge variant="destructive" className="text-xs">
            {criticalAlerts} critical
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4" />
            <span>Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getScoreColor(healthScore)}`}>
              {healthScore}/100
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getScoreIcon(healthScore)}
            <span className="text-xs text-muted-foreground">
              {isHealthy ? 'Healthy' : 'Issues detected'}
            </span>
          </div>
          
          {alerts.length > 0 && (
            <Badge variant={criticalAlerts > 0 ? 'destructive' : 'secondary'} className="text-xs">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {expanded && (
          <div className="space-y-3 mt-3 pt-3 border-t">
            {/* Core Web Vitals Summary */}
            <div>
              <h4 className="text-xs font-medium mb-2">Core Web Vitals</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(summary.metrics || {}).slice(0, 4).map(([metric, data]) => (
                  <div key={metric} className="flex justify-between">
                    <span>{metric}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        data.rating === 'good' ? 'border-green-200 text-green-700' :
                        data.rating === 'needs-improvement' ? 'border-yellow-200 text-yellow-700' :
                        'border-red-200 text-red-700'
                      }`}
                    >
                      {data.rating}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Recent Alerts</h4>
                <div className="space-y-1">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <AlertTriangle className={`h-3 w-3 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <span className="truncate">{alert.metric}: {alert.value.toFixed(0)}ms</span>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{alerts.length - 3} more alerts
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="text-xs text-muted-foreground">
              Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceWidget;