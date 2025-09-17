import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  Mail, 
  Bot, 
  Target, 
  TrendingUp, 
  Zap, 
  Crown, 
  AlertTriangle, 
  CheckCircle,
  Gift,
  BarChart3,
  Users,
  Server,
  Timer,
  ArrowUp,
  Eye,
  DollarSign
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface ScheduleSettings {
  enabled: boolean;
  time: string;
  weekdays: string[];
  emailNotification: boolean;
}

interface SmartSchedulingInterfaceProps {
  userPlan: UserPlan;
  usedAnalyses: number;
  totalAnalyses: number | 'unlimited';
  canStartAnalysis: boolean;
  onStartAnalysis: () => void;
  onScheduleChange: (settings: ScheduleSettings) => void;
  onUpgrade: () => void;
}

const weekdayOptions = [
  { id: 'mo', label: 'Mo', fullName: 'Montag' },
  { id: 'di', label: 'Di', fullName: 'Dienstag' },
  { id: 'mi', label: 'Mi', fullName: 'Mittwoch' },
  { id: 'do', label: 'Do', fullName: 'Donnerstag' },
  { id: 'fr', label: 'Fr', fullName: 'Freitag' },
  { id: 'sa', label: 'Sa', fullName: 'Samstag' },
  { id: 'so', label: 'So', fullName: 'Sonntag' }
];

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function SmartSchedulingInterface({
  userPlan,
  usedAnalyses,
  totalAnalyses,
  canStartAnalysis,
  onStartAnalysis,
  onScheduleChange,
  onUpgrade
}: SmartSchedulingInterfaceProps) {
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    enabled: false,
    time: '08:00',
    weekdays: ['mo', 'di', 'mi', 'do', 'fr'],
    emailNotification: true
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'none' | 'success' | 'error'>('none');

  const handleScheduleUpdate = (updates: Partial<ScheduleSettings>) => {
    const newSchedule = { ...schedule, ...updates };
    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  const toggleWeekday = (weekdayId: string) => {
    const newWeekdays = schedule.weekdays.includes(weekdayId)
      ? schedule.weekdays.filter(id => id !== weekdayId)
      : [...schedule.weekdays, weekdayId];
    
    handleScheduleUpdate({ weekdays: newWeekdays });
  };

  const handlePromoSubmit = () => {
    const validCodes = ['WELCOME2024', 'FULLACCESS', 'PREMIUM7', 'STARTUP50'];
    
    if (validCodes.includes(promoCode.toUpperCase())) {
      setPromoStatus('success');
      setTimeout(() => setPromoStatus('none'), 5000);
    } else {
      setPromoStatus('error');
      setTimeout(() => setPromoStatus('none'), 3000);
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}min`;
  };

  const getPlanConfig = () => {
    switch (userPlan) {
      case 'basic':
        return {
          dailyLimit: 1,
          extraCost: 4.99,
          upgradeTarget: 'Business für 3x täglich',
          description: '1 Analyse/Tag',
          features: ['Basis-Analyse', 'Email-Reports']
        };
      case 'business':
        return {
          dailyLimit: 3,
          extraCost: 2.99,
          upgradeTarget: 'Premium für unbegrenzte Analysen',
          description: '3 Analysen/Tag',
          features: ['Erweiterte AI-Analyse', 'Scheduling', 'Multi-Platform']
        };
      case 'premium':
        return {
          dailyLimit: 'unlimited',
          extraCost: 0,
          upgradeTarget: null,
          description: 'Unbegrenzte Analysen',
          features: ['Priority-Queue (50% schneller)', 'Advanced AI-Features', 'API-Zugang']
        };
      default:
        return {
          dailyLimit: 1,
          extraCost: 4.99,
          upgradeTarget: 'Business für 3x täglich',
          description: '1 Analyse/Tag',
          features: ['Basis-Analyse']
        };
    }
  };

  const planConfig = getPlanConfig();
  const isUnlimited = totalAnalyses === 'unlimited';
  const progressPercentage = isUnlimited ? 0 : (usedAnalyses / (totalAnalyses as number)) * 100;

  return (
    <div className="space-y-8">
      {/* Automated Analysis Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">⏰ Automatische Analysen einrichten</h2>
            <p className="text-sm text-muted-foreground">
              Lassen Sie Ihre Sichtbarkeit regelmäßig überwachen
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="font-medium">Auto-Analyse aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Automatische Durchführung nach Ihrem Zeitplan
              </p>
            </div>
            <Switch
              checked={schedule.enabled}
              onCheckedChange={(enabled) => handleScheduleUpdate({ enabled })}
            />
          </div>

          {schedule.enabled && (
            <div className="space-y-6 p-4 bg-success/5 rounded-lg border border-success/20">
              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Zeitauswahl
                  </Label>
                  <Select 
                    value={schedule.time} 
                    onValueChange={(time) => handleScheduleUpdate({ time })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          Täglich um {time} Uhr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Benachrichtigung
                  </Label>
                  <div className="flex items-center space-x-3 p-3 bg-background rounded-md border">
                    <Checkbox
                      id="email-notification"
                      checked={schedule.emailNotification}
                      onCheckedChange={(emailNotification) => 
                        handleScheduleUpdate({ emailNotification: !!emailNotification })
                      }
                    />
                    <Label htmlFor="email-notification" className="cursor-pointer">
                      📧 Ergebnisse per E-Mail senden
                    </Label>
                  </div>
                </div>
              </div>

              {/* Weekdays Grid */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Wochentage auswählen
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {weekdayOptions.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleWeekday(day.id)}
                      className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                        schedule.weekdays.includes(day.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ausgewählt: {schedule.weekdays.map(id => 
                    weekdayOptions.find(day => day.id === id)?.fullName
                  ).join(', ')}
                </p>
              </div>

              {/* Schedule Preview */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-medium">Nächste Analyse:</span>
                  <span>Morgen um {schedule.time} Uhr</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Recommendations */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">🤖 Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground">KI-basierte Empfehlungen</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Server className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Optimale Server-Zeit</p>
                  <p className="text-sm text-muted-foreground">
                    🤖 Empfohlen: Montag 08:00 (geringste Server-Last)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Analyse-Häufigkeit</p>
                  <p className="text-sm text-muted-foreground">
                    📊 Optimal: Alle 3 Tage (basierend auf Änderungsfrequenz)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-error/5 rounded-lg border border-error/20">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Competitor Intelligence</p>
                  <p className="text-sm text-muted-foreground">
                    🎯 Ihre Konkurrenz analysiert meist Dienstag morgens
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Quota Management */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">📊 Usage-Quota Management</h3>
              <p className="text-sm text-muted-foreground">Plan-spezifische Limits</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Plan Status */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className={`w-4 h-4 ${userPlan === 'premium' ? 'text-warning' : 'text-muted-foreground'}`} />
                  <span className="font-medium capitalize">{userPlan} Plan</span>
                </div>
                <Badge variant={userPlan === 'premium' ? 'default' : 'secondary'}>
                  {planConfig.description}
                </Badge>
              </div>

              {!isUnlimited && (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Heute verwendet:</span>
                    <span className="font-medium">{usedAnalyses}/{totalAnalyses}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2 mb-3" />
                </>
              )}

              <div className="text-sm text-muted-foreground">
                {userPlan !== 'premium' && !canStartAnalysis ? (
                  <div className="flex items-center gap-2 text-error">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Nächste kostenlose Analyse: in {getTimeUntilReset()}</span>
                  </div>
                ) : userPlan === 'premium' ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>✅ Unbegrenzte Analysen verfügbar</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span>Remaining Credits: {(totalAnalyses as number) - usedAnalyses}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Analysis Option */}
            {userPlan !== 'premium' && !canStartAnalysis && (
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Extra-Analyse</span>
                  <span className="font-bold">€{planConfig.extraCost}/Stück</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Einmalige Zahlung für zusätzliche Analyse
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Jetzt kaufen
                </Button>
              </div>
            )}

            {/* Upgrade CTA */}
            {planConfig.upgradeTarget && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Mehr Analysen?</p>
                    <p className="text-xs text-muted-foreground">
                      {planConfig.upgradeTarget}
                    </p>
                  </div>
                  <Button size="sm" onClick={onUpgrade}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              </div>
            )}

            {/* Premium Features */}
            {userPlan === 'premium' && (
              <div className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                <div className="space-y-2">
                  {planConfig.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* On-Demand Analysis */}
      <Card className="p-6">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Sofort-Analyse starten</h3>
              <p className="text-sm text-muted-foreground">
                Starten Sie eine Analyse jetzt oder planen Sie für später
              </p>
            </div>
          </div>

          {canStartAnalysis ? (
            <div className="space-y-4">
              <Button 
                size="lg" 
                onClick={onStartAnalysis}
                className="w-full md:w-auto min-w-64"
              >
                <Zap className="w-5 h-5 mr-2" />
                Sofort analysieren
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>⏱️ 3-5 Minuten</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Bot className="w-4 h-4" />
                  <span>🤖 KI-gestützt</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>🎯 Vollständig</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                size="lg" 
                disabled
                className="w-full md:w-auto min-w-64"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Limit erreicht
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Nächste kostenlose Analyse in {getTimeUntilReset()}
              </div>
              
              <Button 
                variant="outline" 
                size="lg"
                className="w-full md:w-auto min-w-64"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Für €{planConfig.extraCost} zusätzlich analysieren
              </Button>
            </div>
          )}

          {userPlan !== 'premium' && (
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <p className="text-sm text-muted-foreground mb-2">
                💡 Premium-User: Schnellere AI-Queue verfügbar
              </p>
              <Button variant="outline" size="sm" onClick={onUpgrade}>
                <Crown className="w-4 h-4 mr-2" />
                Jetzt upgraden
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Promo Code Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">🎁 Promo-Code</h3>
              <p className="text-sm text-muted-foreground">Freischaltung von Features</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Promo-Code eingeben"
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

            {promoStatus === 'success' && (
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>✅ Vollzugang freigeschaltet!</span>
                </div>
              </div>
            )}

            {promoStatus === 'error' && (
              <div className="p-3 bg-error/10 rounded-lg border border-error/20">
                <div className="flex items-center gap-2 text-error text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>❌ Ungültiger Promo-Code</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Beispiel-Codes:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <code className="p-2 bg-muted rounded font-mono">WELCOME2024</code>
                <code className="p-2 bg-muted rounded font-mono">FULLACCESS</code>
                <code className="p-2 bg-muted rounded font-mono">PREMIUM7</code>
                <code className="p-2 bg-muted rounded font-mono">STARTUP50</code>
              </div>
              <p className="text-xs text-muted-foreground">
                ℹ️ Codes per E-Mail oder Support erhalten
              </p>
            </div>
          </div>
        </Card>

        {/* Analytics Preview */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">📊 Analytics Preview</h3>
              <p className="text-sm text-muted-foreground">Letzte Analysen & Trends</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="text-2xl font-bold text-success">7</div>
                <div className="text-sm text-muted-foreground">Letzte 7 Analysen</div>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">+12%</div>
                <div className="text-sm text-muted-foreground">Visibility-Trend</div>
              </div>
            </div>

            {/* Trend Insights */}
            <div className="space-y-3">
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>📈 Visibility-Trend: +12% diese Woche</span>
                </div>
              </div>
              
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>🎯 Beste Analyse-Zeit: Montag 08:15</span>
                </div>
              </div>
              
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-warning" />
                  <span>🏆 Top-Plattform: Google My Business</span>
                </div>
              </div>
            </div>

            {/* View All Button */}
            <Button variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              📊 Alle Analysen anzeigen
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}