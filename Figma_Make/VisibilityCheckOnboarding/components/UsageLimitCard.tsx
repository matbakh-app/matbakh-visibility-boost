import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Clock, Zap, Crown, AlertTriangle, CheckCircle, ArrowUp } from 'lucide-react';

type PlanType = 'basic' | 'business' | 'premium';

interface UsageLimitCardProps {
  plan: PlanType;
  used: number;
  total: number | 'unlimited';
  resetTime?: string;
  onUpgrade?: () => void;
}

export function UsageLimitCard({ plan, used, total, resetTime = '00:00', onUpgrade }: UsageLimitCardProps) {
  const isUnlimited = total === 'unlimited';
  const percentage = isUnlimited ? 0 : Math.min((used / (total as number)) * 100, 100);
  const isLimitReached = !isUnlimited && used >= (total as number);
  const remaining = isUnlimited ? 'unbegrenzt' : Math.max((total as number) - used, 0);

  const getPlanConfig = () => {
    switch (plan) {
      case 'basic':
        return {
          title: 'Basic Plan',
          icon: '📊',
          color: 'border-gray-200',
          bgColor: 'bg-gray-50/50',
          upgradeTarget: 'Business Plan für unbegrenzte Analysen'
        };
      case 'business':
        return {
          title: 'Business Plan',
          icon: '💼',
          color: 'border-primary/20',
          bgColor: 'bg-primary/5',
          upgradeTarget: 'Premium Plan für Priority-Queue'
        };
      case 'premium':
        return {
          title: 'Premium Plan',
          icon: '👑',
          color: 'border-warning/20',
          bgColor: 'bg-gradient-to-br from-warning/10 to-warning/5',
          upgradeTarget: null
        };
      default:
        return {
          title: 'Basic Plan',
          icon: '📊',
          color: 'border-gray-200',
          bgColor: 'bg-gray-50/50',
          upgradeTarget: 'Business Plan für unbegrenzte Analysen'
        };
    }
  };

  const getStatusConfig = () => {
    if (isUnlimited) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-success" />,
        text: '✅ Unbegrenzte Analysen verfügbar',
        textColor: 'text-success'
      };
    }
    
    if (isLimitReached) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-error" />,
        text: `❌ Limit erreicht - nächste Analyse in ${getTimeUntilReset()}`,
        textColor: 'text-error'
      };
    }
    
    if (percentage >= 80) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-warning" />,
        text: `⚠️ ${remaining} Analyse${remaining === 1 ? '' : 'n'} heute noch verfügbar`,
        textColor: 'text-warning'
      };
    }
    
    return {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      text: `✅ ${remaining} Analyse${remaining === 1 ? '' : 'n'} heute noch verfügbar`,
      textColor: 'text-success'
    };
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const config = getPlanConfig();
  const status = getStatusConfig();

  return (
    <Card className={`p-6 ${config.color} ${config.bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <h3 className="font-semibold text-card-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">Tägliche Analysen</p>
          </div>
        </div>
        
        {plan === 'premium' && (
          <Badge variant="outline" className="border-warning text-warning">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>

      {/* Usage Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Verwendung heute:
          </span>
          <span className="font-medium">
            {isUnlimited ? `${used}/unbegrenzt` : `${used}/${total}`}
          </span>
        </div>
        
        {!isUnlimited && (
          <Progress 
            value={percentage} 
            className="h-2"
            // Custom colors based on percentage
            style={{
              '--progress-foreground': percentage >= 100 ? '#EF4444' : 
                                    percentage >= 80 ? '#F59E0B' : '#10B981'
            } as React.CSSProperties}
          />
        )}
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          {status.icon}
          <div className="flex-1">
            <p className={`text-sm ${status.textColor}`}>
              {status.text}
            </p>
            {!isUnlimited && !isLimitReached && (
              <p className="text-xs text-muted-foreground mt-1">
                Reset um {resetTime} Uhr
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Premium Features */}
      {plan === 'premium' && (
        <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">Premium Features</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>🚀 Priority-Queue für schnellere Ergebnisse</li>
            <li>📈 Erweiterte AI-Analysen</li>
            <li>📧 Sofortige Email-Reports</li>
            <li>🎯 Competitive Intelligence</li>
          </ul>
        </div>
      )}

      {/* Upgrade CTA */}
      {config.upgradeTarget && onUpgrade && (
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-3">
            {config.upgradeTarget}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onUpgrade}
            className="w-full"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Jetzt upgraden
          </Button>
        </div>
      )}
    </Card>
  );
}

interface CostPreviewCardProps {
  isVisible: boolean;
  costPerAnalysis: number;
  onPurchase?: () => void;
  onWaitUntilTomorrow?: () => void;
}

export function CostPreviewCard({ 
  isVisible, 
  costPerAnalysis, 
  onPurchase, 
  onWaitUntilTomorrow 
}: CostPreviewCardProps) {
  if (!isVisible) return null;

  return (
    <Card className="p-6 border-warning/20 bg-warning/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">⚠️ Tägliches Limit erreicht</h3>
          <p className="text-sm text-muted-foreground">
            Sie haben alle kostenlosen Analysen für heute aufgebraucht
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-background rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Zusätzliche Analyse:</span>
            <span className="text-lg font-bold text-primary">€{costPerAnalysis.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Einmalige Zahlung für eine zusätzliche AI-gestützte Analyse
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onWaitUntilTomorrow} 
            variant="outline" 
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-2" />
            Morgen kostenlos
          </Button>
          <Button 
            onClick={onPurchase} 
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            Jetzt für €{costPerAnalysis.toFixed(2)} kaufen
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Oder upgraden Sie für unbegrenzte tägliche Analysen
        </p>
      </div>
    </Card>
  );
}