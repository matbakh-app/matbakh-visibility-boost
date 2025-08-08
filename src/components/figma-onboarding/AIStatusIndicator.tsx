import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

type AIStatus = 'ready' | 'busy' | 'error' | 'maintenance';

interface AIStatusIndicatorProps {
  status: AIStatus;
  className?: string;
}

export function AIStatusIndicator({ status, className = '' }: AIStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          icon: <Bot className="w-4 h-4" />,
          text: '🤖 KI-Analyse bereit',
          variant: 'default' as const,
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          borderColor: 'border-success/20'
        };
      case 'busy':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: '⚡ KI-Analyse läuft...',
          variant: 'secondary' as const,
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          borderColor: 'border-primary/20'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: '❌ KI-Service Fehler',
          variant: 'destructive' as const,
          bgColor: 'bg-error/10',
          textColor: 'text-error',
          borderColor: 'border-error/20'
        };
      case 'maintenance':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: '⚠️ KI-Service wartend',
          variant: 'outline' as const,
          bgColor: 'bg-warning/10',
          textColor: 'text-warning',
          borderColor: 'border-warning/20'
        };
      default:
        return {
          icon: <Bot className="w-4 h-4" />,
          text: '🤖 KI-Analyse bereit',
          variant: 'default' as const,
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          borderColor: 'border-success/20'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className={config.textColor}>
        {config.icon}
      </div>
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}

interface UsageCounterProps {
  used: number;
  total: number | 'unlimited';
  plan: 'basic' | 'business' | 'premium';
  className?: string;
}

export function UsageCounter({ used, total, plan, className = '' }: UsageCounterProps) {
  const isUnlimited = total === 'unlimited';
  const percentage = isUnlimited ? 0 : (used / (total as number)) * 100;
  
  const getStatusColor = () => {
    if (isUnlimited) return 'text-success';
    if (percentage >= 100) return 'text-error';
    if (percentage >= 80) return 'text-warning';
    return 'text-primary';
  };

  const getPlanIcon = () => {
    switch (plan) {
      case 'basic':
        return '📊';
      case 'business':
        return '💼';
      case 'premium':
        return '👑';
      default:
        return '📊';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-card border ${className}`}>
      <span className="text-sm">{getPlanIcon()}</span>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {isUnlimited 
          ? `${used} Analysen heute` 
          : `${used} von ${total} Analysen heute`
        }
      </span>
    </div>
  );
}