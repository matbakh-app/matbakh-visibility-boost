import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSLOAlerts, useSLOMonitoring } from '@/hooks/useSLOMonitoring';
import { SLOAlert } from '@/lib/monitoring/slo-monitoring-service';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Filter,
    Info
} from 'lucide-react';
import React, { useState } from 'react';

interface AlertDetailsModalProps {
  alert: SLOAlert;
  onResolve: (alertId: string) => void;
}

const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({ alert, onResolve }) => {
  const { getSLODefinition } = useSLOMonitoring();
  const sloDefinition = getSLODefinition(alert.sloId);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          {getSeverityIcon(alert.severity)}
          <span>{alert.title}</span>
          <Badge variant={
            alert.severity === 'critical' ? 'destructive' :
            alert.severity === 'warning' ? 'destructive' : 'default'
          } className={
            alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''
          }>
            {alert.severity}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Alert details and resolution options
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Alert Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Alert ID</label>
                <p className="text-sm font-mono">{alert.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-sm capitalize">{alert.type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{formatTimestamp(alert.timestamp)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm">
                  {alert.resolved ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Active</Badge>
                  )}
                </p>
              </div>
            </div>
            
            {alert.resolved && alert.resolvedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">Resolved At</label>
                <p className="text-sm">{formatTimestamp(alert.resolvedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLO Information */}
        {sloDefinition && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related SLO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">SLO Name</label>
                <p className="text-sm font-medium">{sloDefinition.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm">{sloDefinition.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm capitalize">{sloDefinition.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target</label>
                  <p className="text-sm">{sloDefinition.target}{sloDefinition.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Error Budget</label>
                  <p className="text-sm">{sloDefinition.errorBudget}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm">{alert.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Value</label>
                <p className="text-sm font-mono">{alert.currentValue.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Threshold</label>
                <p className="text-sm font-mono">{alert.threshold.toFixed(2)}</p>
              </div>
            </div>
            
            {alert.metadata && Object.keys(alert.metadata).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Additional Information</label>
                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(alert.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!alert.resolved && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onResolve(alert.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

interface AlertCardProps {
  alert: SLOAlert;
  onResolve: (alertId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onResolve }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'warning': return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info': return <Badge variant="default" className="bg-blue-100 text-blue-800">Info</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={`${alert.resolved ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                {getSeverityBadge(alert.severity)}
                {alert.resolved && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(alert.timestamp)}</span>
                </span>
                <span>Type: {alert.type.replace('_', ' ')}</span>
                <span>Value: {alert.currentValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <AlertDetailsModal alert={alert} onResolve={onResolve} />
            </Dialog>
            {!alert.resolved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(alert.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SLOAlertManager: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showResolved, setShowResolved] = useState(false);

  const { 
    alerts: allAlerts, 
    resolveAlert,
    criticalCount,
    warningCount,
    infoCount
  } = useSLOAlerts({ resolved: showResolved ? undefined : false });

  const filteredAlerts = allAlerts.filter(alert => {
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    return true;
  });

  const exportAlerts = () => {
    const csvContent = [
      ['ID', 'Title', 'Severity', 'Type', 'SLO ID', 'Current Value', 'Threshold', 'Created', 'Resolved', 'Description'].join(','),
      ...filteredAlerts.map(alert => [
        alert.id,
        `"${alert.title}"`,
        alert.severity,
        alert.type,
        alert.sloId,
        alert.currentValue.toFixed(2),
        alert.threshold.toFixed(2),
        alert.timestamp.toISOString(),
        alert.resolved ? 'Yes' : 'No',
        `"${alert.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slo-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SLO Alert Manager</h2>
          <p className="text-gray-600">Monitor and manage SLO violations and alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportAlerts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-sm text-gray-600">Warning</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{infoCount}</div>
                <div className="text-sm text-gray-600">Info</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allAlerts.filter(a => a.resolved).length}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Tabs value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="warning">Warning</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant={showResolved ? "default" : "outline"}
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide' : 'Show'} Resolved
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {selectedSeverity === 'all' 
                  ? 'All SLOs are healthy and no alerts are active.'
                  : `No ${selectedSeverity} alerts found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {filteredAlerts.length} Alert{filteredAlerts.length !== 1 ? 's' : ''}
                {selectedSeverity !== 'all' && ` (${selectedSeverity})`}
              </h3>
              {filteredAlerts.filter(a => !a.resolved).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    filteredAlerts
                      .filter(a => !a.resolved)
                      .forEach(alert => resolveAlert(alert.id));
                  }}
                >
                  Resolve All Visible
                </Button>
              )}
            </div>
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={resolveAlert}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};