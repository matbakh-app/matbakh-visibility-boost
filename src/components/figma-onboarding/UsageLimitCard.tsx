import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Clock, Zap } from 'lucide-react';
import { UserPlan } from '@/types/app';

interface UsageLimitCardProps {
  plan: UserPlan;
  used: number;
  total: number | 'unlimited';
  resetTime: string;
  onUpgrade: () => void;
}

export function UsageLimitCard({ plan, used, total, resetTime, onUpgrade }: UsageLimitCardProps) {
  const isUnlimited = total === 'unlimited';
  const percentage = isUnlimited ? 0 : (used / (total as number)) * 100;
  
  const getPlanColor = () => {
    switch (plan) {
      case 'basic': return 'text-blue-600';
      case 'business': return 'text-green-600';
      case 'premium': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getPlanIcon = () => {
    switch (plan) {
      case 'basic': return '📊';
      case 'business': return '💼';
      case 'premium': return '👑';
      default: return '📊';
    }
  };

  return (
    <Card className="card-dark-enhanced">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{getPlanIcon()}</span>
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </CardTitle>
          {plan === 'premium' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Analysen verwendet</span>
            <span className={`text-sm font-medium ${getPlanColor()}`}>
              {isUnlimited ? `${used} heute` : `${used}/${total}`}
            </span>
          </div>
          {!isUnlimited && (
            <Progress value={percentage} className="h-2" />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Reset: {resetTime}
          </div>
          {percentage >= 80 && !isUnlimited && (
            <span className="text-warning">Limit fast erreicht</span>
          )}
        </div>

        {plan !== 'premium' && (
          <Button 
            onClick={onUpgrade} 
            className="w-full btn-hover-enhanced"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade für mehr Analysen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface CostPreviewCardProps {
  isVisible: boolean;
  costPerAnalysis: number;
  onPurchase: () => void;
  onWaitUntilTomorrow: () => void;
}

export function CostPreviewCard({ 
  isVisible, 
  costPerAnalysis, 
  onPurchase, 
  onWaitUntilTomorrow 
}: CostPreviewCardProps) {
  if (!isVisible) return null;

  return (
    <Card className="border-warning bg-warning/5">
      <CardContent className="p-4">
        <h4 className="font-medium text-sm mb-2">💰 Zusätzliche Analyse</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Ihr monatliches Limit ist erreicht. Sie können eine zusätzliche Analyse für {costPerAnalysis}€ kaufen.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onPurchase} className="flex-1">
            Für {costPerAnalysis}€ kaufen
          </Button>
          <Button variant="outline" size="sm" onClick={onWaitUntilTomorrow}>
            Bis morgen warten
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}