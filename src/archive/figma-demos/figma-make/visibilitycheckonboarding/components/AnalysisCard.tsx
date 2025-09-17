import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface AnalysisCardProps {
  title: string;
  score?: number;
  status: 'success' | 'warning' | 'error' | 'info';
  platform?: string;
  description: string;
  recommendations?: string[];
  actionUrl?: string;
  isLocked?: boolean;
}

export function AnalysisCard({ 
  title, 
  score, 
  status, 
  platform, 
  description, 
  recommendations = [], 
  actionUrl,
  isLocked = false 
}: AnalysisCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-primary';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <TrendingDown className="w-5 h-5 text-error" />;
      default:
        return <TrendingUp className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'error':
        return 'bg-error/10 border-error/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className={`relative rounded-lg border bg-card shadow-sm transition-all hover:shadow-md ${isLocked ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className={`p-6 border-b border-border`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              {platform && (
                <span className="text-sm text-muted-foreground">{platform}</span>
              )}
            </div>
          </div>
          {score !== undefined && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {score}%
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {recommendations.length > 0 && (
          <div className={`rounded-lg border p-4 ${getStatusBg()}`}>
            <h4 className="font-medium text-sm mb-2">Empfehlungen:</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionUrl && !isLocked && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={actionUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Weitere Details anzeigen
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Lock overlay for premium features */}
      {isLocked && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-gray-900">Premium Feature</p>
            <p className="text-xs text-gray-600 mt-1">Upgrade für detaillierte Analyse</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  format?: 'number' | 'percentage' | 'currency';
  status?: 'positive' | 'negative' | 'neutral';
}

export function MetricCard({ label, value, change, format = 'number', status = 'neutral' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'percentage') return `${val}%`;
    if (format === 'currency') return `€${val}`;
    return val;
  };

  const getChangeColor = () => {
    if (status === 'positive') return 'text-success';
    if (status === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
            {change > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : change < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-card-foreground">
          {formatValue(value)}
        </div>
      </div>
    </div>
  );
}