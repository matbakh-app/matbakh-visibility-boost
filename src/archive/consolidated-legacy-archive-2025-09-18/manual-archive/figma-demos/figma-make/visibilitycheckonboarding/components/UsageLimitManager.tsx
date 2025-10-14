import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  AlertTriangle, 
  Clock, 
  Crown, 
  CreditCard, 
  Gift, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  XCircle,
  Zap,
  Timer,
  DollarSign,
  Mail,
  Target,
  ArrowUp,
  Lightbulb,
  Calendar,
  TrendingDown
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface UsageData {
  used: number;
  total: number | 'unlimited';
  resetTime: string;
}

interface UsageLimitManagerProps {
  userPlan: UserPlan;
  usageData: UsageData;
  onUpgrade: () => void;
  onPurchaseAnalysis: () => void;
  onStartAnalysis: () => void;
  canStartAnalysis: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
}

interface PromoCode {
  code: string;
  type: 'welcome' | 'unlimited' | 'discount';
  description: string;
  benefit: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Kreditkarte',
    icon: <CreditCard className="w-4 h-4" />,
    available: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: <DollarSign className="w-4 h-4" />,
    available: true
  },
  {
    id: 'invoice',
    name: 'Auf Rechnung',
    icon: <Mail className="w-4 h-4" />,
    available: false // Only for business customers
  }
];

const promoCodes: PromoCode[] = [
  {
    code: 'WELCOME',
    type: 'welcome',
    description: 'Erste Analyse kostenlos',
    benefit: '1x kostenlose Analyse'
  },
  {
    code: 'UNLIMITED30',
    type: 'unlimited',
    description: '30 Tage unbegrenzte Analysen',
    benefit: '30 Tage Premium-Zugang'
  },
  {
    code: 'RESTAURANT2024',
    type: 'discount',
    description: '50% Rabatt auf Business Plan',
    benefit: '3 Monate zum halben Preis'
  }
];

// Mock usage analytics data
const mockUsageAnalytics = {
  last30Days: [
    { date: '2024-01-01', analyses: 1 },
    { date: '2024-01-02', analyses: 0 },
    { date: '2024-01-03', analyses: 2 },
    { date: '2024-01-04', analyses: 1 },
    { date: '2024-01-05', analyses: 3 },
    { date: '2024-01-06', analyses: 0 },
    { date: '2024-01-07', analyses: 1 }
  ],
  averagePerWeek: 2.3,
  totalThisMonth: 8,
  peakDay: 'Montag',
  recommendedPlan: 'business'
};

export function UsageLimitManager({
  userPlan,
  usageData,
  onUpgrade,
  onPurchaseAnalysis,
  onStartAnalysis,
  canStartAnalysis
}: UsageLimitManagerProps) {
  const [showPayPerUseModal, setShowPayPerUseModal] = useState(false);
  const [showUsageAnalytics, setShowUsageAnalytics] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'none' | 'success' | 'error'>('none');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Calculate time until reset
  useEffect(() => {
    const updateTimeUntilReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diffMs = tomorrow.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${diffHours}h ${diffMinutes}m ${diffSeconds}s`);
    };

    updateTimeUntilReset();
    const interval = setInterval(updateTimeUntilReset, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePromoSubmit = () => {
    const validPromo = promoCodes.find(p => p.code.toUpperCase() === promoCode.toUpperCase());
    
    if (validPromo) {
      setPromoStatus('success');
      setAppliedPromo(validPromo);
      setTimeout(() => setPromoStatus('none'), 5000);
    } else {
      setPromoStatus('error');
      setTimeout(() => setPromoStatus('none'), 3000);
    }
  };

  const getPlanConfig = () => {
    switch (userPlan) {
      case 'basic':
        return {
          dailyLimit: 1,
          extraCost: 4.99,
          upgradeTarget: 'Business',
          upgradeBenefit: '3x täglich analysieren',
          monthlyPayPerUseCost: 150,
          features: ['Basis-Analyse', 'Email-Reports']
        };
      case 'business':
        return {
          dailyLimit: 3,
          extraCost: 2.99,
          upgradeTarget: 'Premium',
          upgradeBenefit: 'Unbegrenzte Analysen',
          monthlyPayPerUseCost: 90,
          features: ['Erweiterte AI-Analyse', 'Scheduling', 'Multi-Platform']
        };
      case 'premium':
        return {
          dailyLimit: 'unlimited',
          extraCost: 0,
          upgradeTarget: null,
          upgradeBenefit: null,
          monthlyPayPerUseCost: 0,
          features: ['Priority-Queue (50% schneller)', 'Advanced AI-Features', 'API-Zugang']
        };
      default:
        return {
          dailyLimit: 1,
          extraCost: 4.99,
          upgradeTarget: 'Business',
          upgradeBenefit: '3x täglich analysieren',
          monthlyPayPerUseCost: 150,
          features: ['Basis-Analyse']
        };
    }
  };

  const planConfig = getPlanConfig();
  const isUnlimited = usageData.total === 'unlimited';
  const progressPercentage = isUnlimited ? 0 : (usageData.used / (usageData.total as number)) * 100;
  const isHardLimit = !canStartAnalysis && userPlan !== 'premium';
  const isSoftLimit = canStartAnalysis && userPlan === 'business' && usageData.used === (usageData.total as number) - 1;

  // Hard Limit Card (Basic Plan - Limit reached)
  if (isHardLimit) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-error/20 bg-error/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-error" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-error">❌ Tägliches Limit erreicht</h3>
              <p className="text-sm text-muted-foreground">
                Sie haben heute bereits {usageData.used} Analyse{usageData.used > 1 ? 'n' : ''} durchgeführt
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="p-4 bg-background rounded-lg border mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Nächste kostenlose Analyse in:</span>
              </div>
              <div className="text-xl font-bold text-primary font-mono">
                {timeUntilReset}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onUpgrade}
              size="lg" 
              className="w-full"
            >
              <Crown className="w-5 h-5 mr-2" />
              {planConfig.upgradeTarget} Plan upgraden
            </Button>
            
            <Button 
              onClick={() => setShowPayPerUseModal(true)}
              variant="outline" 
              size="lg"
              className="w-full"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Für €{planConfig.extraCost} jetzt analysieren
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg"
              className="w-full"
              disabled
            >
              <Timer className="w-5 h-5 mr-2" />
              Morgen kostenlos weitermachen
            </Button>
          </div>
        </Card>

        {/* Upgrade Incentive */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center space-y-4">
            <h4 className="font-bold">💰 Sparen Sie bares Geld!</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-background rounded-lg">
                <div className="font-bold text-error">Pay-per-Use</div>
                <div className="text-muted-foreground">€{planConfig.monthlyPayPerUseCost}/Monat</div>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <div className="font-bold text-success">{planConfig.upgradeTarget} Plan</div>
                <div className="text-muted-foreground">€29/Monat</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {planConfig.upgradeTarget} Plan spart bis zu 80% der Kosten
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Soft Limit Warning (Business Plan - Last analysis available)
  if (isSoftLimit) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-warning/20 bg-warning/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-warning">⚠️ Noch 1 Analyse heute verfügbar</h3>
              <p className="text-sm text-muted-foreground">
                Nutzen Sie Ihre letzte Analyse heute optimal
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Heute verwendet:</span>
              <span className="font-medium">{usageData.used}/{usageData.total}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Smart Suggestion */}
          <div className="p-4 bg-background rounded-lg border mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Smart-Suggestion</span>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Beste Zeit für letzte Analyse: 16:00-18:00 (weniger Server-Last)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onStartAnalysis}
              size="lg" 
              className="w-full"
            >
              <Zap className="w-5 h-5 mr-2" />
              Jetzt analysieren
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="w-full"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Für später einplanen
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg"
              className="w-full"
              onClick={onUpgrade}
            >
              <Crown className="w-5 h-5 mr-2" />
              Premium für unbegrenzt
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Premium or Normal State
  return (
    <div className="space-y-6">
      {/* Main Usage Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Usage Overview</h3>
            <p className="text-sm text-muted-foreground">
              {userPlan === 'premium' ? 'Unbegrenzte Analysen verfügbar' : `${usageData.used}/${usageData.total} Analysen heute verwendet`}
            </p>
          </div>
          
          <Badge variant={userPlan === 'premium' ? 'default' : 'secondary'} className="capitalize">
            {userPlan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
            {userPlan} Plan
          </Badge>
        </div>

        {!isUnlimited && (
          <div className="mb-6">
            <Progress value={progressPercentage} className="h-3 mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Verwendet: {usageData.used}</span>
              <span>Verfügbar: {(usageData.total as number) - usageData.used}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={onStartAnalysis}
          size="lg" 
          className="w-full mb-4"
          disabled={!canStartAnalysis}
        >
          <Zap className="w-5 h-5 mr-2" />
          {canStartAnalysis ? 'Analyse starten' : 'Limit erreicht'}
        </Button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUsageAnalytics(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics anzeigen
          </Button>
          
          {userPlan !== 'premium' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPayPerUseModal(true)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Extra kaufen
            </Button>
          )}
        </div>
      </Card>

      {/* Promo Code Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <h4 className="font-semibold">📧 Promo-Code erhalten?</h4>
            <p className="text-sm text-muted-foreground">Freischaltung von Features</p>
          </div>
        </div>

        {appliedPromo ? (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 text-success text-sm mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">🎉 {appliedPromo.benefit} freigeschaltet!</span>
            </div>
            <p className="text-xs text-muted-foreground">{appliedPromo.description}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Code hier eingeben"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className={`flex-1 ${
                  promoStatus === 'success' ? 'border-success' : 
                  promoStatus === 'error' ? 'border-error' : ''
                }`}
              />
              <Button 
                onClick={handlePromoSubmit}
                disabled={!promoCode.trim()}
                variant={promoStatus === 'success' ? 'default' : 'outline'}
              >
                {promoStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  'Einlösen'
                )}
              </Button>
            </div>

            {promoStatus === 'error' && (
              <div className="p-3 bg-error/10 rounded-lg border border-error/20">
                <div className="flex items-center gap-2 text-error text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>❌ Ungültiger Promo-Code</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {promoCodes.map((promo, index) => (
                <code 
                  key={index}
                  className="p-2 bg-muted rounded font-mono cursor-pointer hover:bg-muted/80"
                  onClick={() => setPromoCode(promo.code)}
                >
                  {promo.code}
                </code>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pay-per-Use Modal */}
      <Dialog open={showPayPerUseModal} onOpenChange={setShowPayPerUseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Zusätzliche Analyse kaufen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="text-center space-y-3">
                <div className="text-2xl font-bold">€{planConfig.extraCost}</div>
                <div className="font-medium">Eine zusätzliche AI-Analyse</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>✅ Vollständige Bedrock/OnPal KI-Auswertung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>✅ Alle Premium-Insights inklusive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>✅ Dashboard-Daten aktualisiert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>⏱️ Sofort verfügbar</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h4 className="font-medium">Zahlungsmethode wählen:</h4>
              
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={!method.available}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span>{method.name}</span>
                    {!method.available && (
                      <Badge variant="secondary" className="ml-auto">
                        Nur Business-Kunden
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Purchase Button */}
            <Button 
              onClick={() => {
                onPurchaseAnalysis();
                setShowPayPerUseModal(false);
              }}
              size="lg" 
              className="w-full"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Jetzt für €{planConfig.extraCost} kaufen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage Analytics Modal */}
      <Dialog open={showUsageAnalytics} onOpenChange={setShowUsageAnalytics}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>📊 Ihre Analyse-Historie (letzte 30 Tage)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{mockUsageAnalytics.totalThisMonth}</div>
                <div className="text-sm text-muted-foreground">Diesen Monat</div>
              </div>
              <div className="p-4 bg-success/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-success">{mockUsageAnalytics.averagePerWeek}</div>
                <div className="text-sm text-muted-foreground">Ø pro Woche</div>
              </div>
              <div className="p-4 bg-warning/5 rounded-lg text-center">
                <div className="text-2xl font-bold text-warning">{mockUsageAnalytics.peakDay}</div>
                <div className="text-sm text-muted-foreground">Peak-Tag</div>
              </div>
            </div>

            {/* Simple Usage Chart */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Usage-Pattern (letzte 7 Tage)</h4>
              <div className="flex items-end gap-2 h-24">
                {mockUsageAnalytics.last30Days.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${(day.analyses / 3) * 100}%` }}
                    />
                    <div className="text-xs mt-1">{day.analyses}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendation */}
            <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-success" />
                <h4 className="font-medium">💡 Empfehlung basierend auf Ihrem Usage</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Sie verwenden durchschnittlich {mockUsageAnalytics.averagePerWeek} Analysen pro Woche. 
                Der {mockUsageAnalytics.recommendedPlan} Plan würde 60% Ihrer Kosten sparen.
              </p>
              <Button size="sm" onClick={onUpgrade}>
                <ArrowUp className="w-4 h-4 mr-2" />
                Zu {mockUsageAnalytics.recommendedPlan.charAt(0).toUpperCase() + mockUsageAnalytics.recommendedPlan.slice(1)} upgraden
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}