import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Code,
  Gift,
  Crown,
  Sparkles,
  Target,
  BarChart3,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  type: 'welcome' | 'business' | 'marketing' | 'custom' | 'referral';
  value: string;
  description: string;
  validUntil: Date;
  redemptionWindow: number;
  maxUses: number | 'unlimited';
  currentUses: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface ReferralSettings {
  enabled: boolean;
  bonusAmount: number;
  maxCredit: number;
  autoDeduct: boolean;
}

interface UsageAnalytics {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  conversionRate: number;
  revenueImpact: number;
  topPerformingCode: string;
}

interface AdminPromoConsoleProps {
  onClose?: () => void;
}

const mockPromoCodes: PromoCode[] = [
  {
    id: '1',
    code: 'WELCOME2024',
    type: 'welcome',
    value: '1 kostenlose Analyse',
    description: 'Willkommens-Bonus für neue Benutzer',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 'unlimited',
    currentUses: 247,
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdBy: 'admin@visibilitycheck.com'
  },
  {
    id: '2',
    code: 'BUSINESS14',
    type: 'business',
    value: '14 Tage Business-Features',
    description: 'Test-Zugang zu erweiterten Features',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 100,
    currentUses: 23,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: 'admin@visibilitycheck.com'
  },
  {
    id: '3',
    code: 'BLACKFRIDAY',
    type: 'marketing',
    value: '60% Rabatt alle Pläne',
    description: 'Black Friday Special Offer',
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    redemptionWindow: 5,
    maxUses: 1000,
    currentUses: 456,
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: 'marketing@visibilitycheck.com'
  }
];

const mockUsageAnalytics: UsageAnalytics = {
  totalCodes: 12,
  activeCodes: 8,
  totalRedemptions: 1247,
  conversionRate: 34.2,
  revenueImpact: 15420,
  topPerformingCode: 'WELCOME2024'
};

export function AdminPromoConsole({ onClose }: AdminPromoConsoleProps) {
  const [codes, setCodes] = useState<PromoCode[]>(mockPromoCodes);
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    enabled: true,
    bonusAmount: 2.00,
    maxCredit: 50.00,
    autoDeduct: true
  });

  // New Code Form State
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'welcome' as PromoCode['type'],
    value: '',
    description: '',
    validUntil: '',
    redemptionWindow: 10,
    maxUses: 'unlimited' as 'unlimited' | number,
    customMaxUses: 100
  });

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const generateRandomCode = () => {
    const prefix = newCode.type.toUpperCase().slice(0, 3);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewCode(prev => ({ ...prev, code: `${prefix}${random}` }));
  };

  const handleCreateCode = () => {
    const code: PromoCode = {
      id: Date.now().toString(),
      code: newCode.code,
      type: newCode.type,
      value: newCode.value,
      description: newCode.description,
      validUntil: new Date(newCode.validUntil),
      redemptionWindow: newCode.redemptionWindow,
      maxUses: newCode.maxUses === 'unlimited' ? 'unlimited' : newCode.customMaxUses,
      currentUses: 0,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'admin@visibilitycheck.com'
    };

    setCodes(prev => [code, ...prev]);
    
    // Reset form
    setNewCode({
      code: '',
      type: 'welcome',
      value: '',
      description: '',
      validUntil: '',
      redemptionWindow: 10,
      maxUses: 'unlimited',
      customMaxUses: 100
    });
  };

  const toggleCodeStatus = (id: string) => {
    setCodes(prev => prev.map(code => 
      code.id === id ? { ...code, isActive: !code.isActive } : code
    ));
  };

  const deleteCode = (id: string) => {
    setCodes(prev => prev.filter(code => code.id !== id));
  };

  const getCodeIcon = (type: PromoCode['type']) => {
    switch (type) {
      case 'welcome': return <Gift className="w-4 h-4" />;
      case 'business': return <Crown className="w-4 h-4" />;
      case 'marketing': return <Sparkles className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      case 'custom': return <Target className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getCodeColor = (type: PromoCode['type']) => {
    switch (type) {
      case 'welcome': return 'success';
      case 'business': return 'default';
      case 'marketing': return 'secondary';
      case 'referral': return 'outline';
      case 'custom': return 'destructive';
      default: return 'secondary';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔧 Admin Promo Console</h2>
          <p className="text-muted-foreground">
            Promo-Code Management und Referral-System Einstellungen
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        )}
      </div>

      <Tabs defaultValue="codes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="codes">
            <Code className="w-4 h-4 mr-2" />
            Codes
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Erstellen
          </TabsTrigger>
          <TabsTrigger value="referral">
            <Users className="w-4 h-4 mr-2" />
            Referral
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Code Management */}
        <TabsContent value="codes" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Alle Promo-Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie bestehende Codes und deren Status
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {codes.map((code) => (
                <Card key={code.id} className={`p-4 ${!code.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                        {getCodeIcon(code.type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium font-mono">{code.code}</span>
                          <Badge variant={getCodeColor(code.type)}>
                            {code.type}
                          </Badge>
                          {!code.isActive && (
                            <Badge variant="destructive">Deaktiviert</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{code.value}</div>
                        <div className="text-xs text-muted-foreground">{code.description}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {code.maxUses === 'unlimited' ? '∞' : `${code.currentUses}/${code.maxUses}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bis {code.validUntil.toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCodeStatus(code.id)}
                        >
                          {code.isActive ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCode(code.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Create New Code */}
        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Neuen Promo-Code erstellen</h3>
                <p className="text-sm text-muted-foreground">
                  Erstellen Sie einen neuen Code mit benutzerdefinierten Einstellungen
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Code-Typ</Label>
                  <Select 
                    value={newCode.type} 
                    onValueChange={(value: PromoCode['type']) => setNewCode(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome - Neue Benutzer</SelectItem>
                      <SelectItem value="business">Business - Upgrade-Incentive</SelectItem>
                      <SelectItem value="marketing">Marketing - Kampagnen</SelectItem>
                      <SelectItem value="custom">Custom - Individuell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom-Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="CODE123"
                      value={newCode.code}
                      onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={generateRandomCode}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Wert/Benefit</Label>
                  <Input
                    placeholder="z.B. 1 kostenlose Analyse, 50% Rabatt"
                    value={newCode.value}
                    onChange={(e) => setNewCode(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Input
                    placeholder="Interne Beschreibung für das Admin-Panel"
                    value={newCode.description}
                    onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Gültigkeitsdauer</Label>
                  <Input
                    type="date"
                    value={newCode.validUntil}
                    onChange={(e) => setNewCode(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Einlöse-Zeitfenster (Tage)</Label>
                  <Input
                    type="number"
                    value={newCode.redemptionWindow}
                    onChange={(e) => setNewCode(prev => ({ ...prev, redemptionWindow: parseInt(e.target.value) }))}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Anzahl Tage nach Einlösung bis Code verfällt
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Verwendungs-Limit</Label>
                  <Select 
                    value={newCode.maxUses.toString()} 
                    onValueChange={(value) => setNewCode(prev => ({ 
                      ...prev, 
                      maxUses: value === 'unlimited' ? 'unlimited' : 'custom'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Unbegrenzt</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {newCode.maxUses !== 'unlimited' && (
                    <Input
                      type="number"
                      placeholder="z.B. 100"
                      value={newCode.customMaxUses}
                      onChange={(e) => setNewCode(prev => ({ ...prev, customMaxUses: parseInt(e.target.value) }))}
                      min="1"
                    />
                  )}
                </div>

                <Button 
                  onClick={handleCreateCode}
                  disabled={!newCode.code || !newCode.value || !newCode.validUntil}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Code generieren
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Referral Settings */}
        <TabsContent value="referral" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Referral-System Einstellungen</h3>
                <p className="text-sm text-muted-foreground">
                  Konfigurieren Sie das Empfehlungsprogramm
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Referral-System aktivieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Benutzer können Freunde empfehlen und Gutschriften verdienen
                  </p>
                </div>
                <Switch
                  checked={referralSettings.enabled}
                  onCheckedChange={(enabled) => setReferralSettings(prev => ({ ...prev, enabled }))}
                />
              </div>

              {referralSettings.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Referral-Bonus (€)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={referralSettings.bonusAmount}
                        onChange={(e) => setReferralSettings(prev => ({ 
                          ...prev, 
                          bonusAmount: parseFloat(e.target.value) 
                        }))}
                        min="0.50"
                        max="10.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Betrag pro erfolgreiche Registrierung
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max-Guthaben (€)</Label>
                      <Input
                        type="number"
                        value={referralSettings.maxCredit}
                        onChange={(e) => setReferralSettings(prev => ({ 
                          ...prev, 
                          maxCredit: parseFloat(e.target.value) 
                        }))}
                        min="10"
                        max="500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximales Guthaben pro Benutzer
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="font-medium">Auto-Abzug aktivieren</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatisch von Subscription abziehen
                        </p>
                      </div>
                      <Switch
                        checked={referralSettings.autoDeduct}
                        onCheckedChange={(autoDeduct) => setReferralSettings(prev => ({ ...prev, autoDeduct }))}
                      />
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-medium mb-2">Aktuelle Einstellungen</h4>
                      <div className="space-y-1 text-sm">
                        <div>💰 Bonus: €{referralSettings.bonusAmount.toFixed(2)} pro Referral</div>
                        <div>🎯 Max. Guthaben: €{referralSettings.maxCredit.toFixed(2)}</div>
                        <div>🔄 Auto-Abzug: {referralSettings.autoDeduct ? 'Aktiviert' : 'Deaktiviert'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockUsageAnalytics.totalCodes}</div>
              <div className="text-sm text-muted-foreground">Gesamt-Codes</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{mockUsageAnalytics.activeCodes}</div>
              <div className="text-sm text-muted-foreground">Aktive Codes</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{mockUsageAnalytics.totalRedemptions}</div>
              <div className="text-sm text-muted-foreground">Einlösungen</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{mockUsageAnalytics.conversionRate}%</div>
              <div className="text-sm text-muted-foreground">Conversion-Rate</div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">📊 Code-Verwendung Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Detaillierte Analyse der Code-Performance
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Label>Zeitraum:</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-auto"
                  />
                  <span>bis</span>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">🎯 Top-Performance</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                    <div className="font-medium">Best Performing Code</div>
                    <div className="text-sm text-muted-foreground">{mockUsageAnalytics.topPerformingCode}</div>
                    <div className="text-sm font-medium text-success">247 Einlösungen</div>
                  </div>
                  
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="font-medium">💰 Revenue Impact</div>
                    <div className="text-sm text-muted-foreground">Durch Codes generiert</div>
                    <div className="text-sm font-medium text-primary">€{mockUsageAnalytics.revenueImpact.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">👥 Referral-Performance</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="font-medium">Gesamt-Referrals</div>
                    <div className="text-sm text-muted-foreground">247 gesendet, 89 eingelöst</div>
                    <div className="text-sm font-medium text-warning">36% Conversion-Rate</div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="font-medium">💰 ROI Calculation</div>
                    <div className="text-sm text-muted-foreground">€890 neue Subscriptions vs. €178 Gutschriften</div>
                    <div className="text-sm font-medium text-purple-600">400% ROI</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}