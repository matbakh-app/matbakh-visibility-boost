import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Gift, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Mail,
  Share,
  QrCode,
  DollarSign,
  Crown,
  Zap,
  Calendar,
  Copy,
  ExternalLink,
  TrendingUp,
  Target,
  Award,
  Sparkles
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface PromoCode {
  code: string;
  type: 'welcome' | 'business' | 'marketing' | 'referral' | 'custom';
  value: string;
  description: string;
  validUntil: Date;
  redemptionWindow: number; // days
  maxUses: number | 'unlimited';
  currentUses: number;
  isActive: boolean;
}

interface AppliedPromo {
  code: string;
  type: PromoCode['type'];
  value: string;
  appliedAt: Date;
  expiresAt: Date;
}

interface ReferralStats {
  sent: number;
  redeemed: number;
  earnings: number;
  nextPayout: number;
}

interface PromoCodeSystemProps {
  userPlan: UserPlan;
  onUpgrade: () => void;
  isAdmin?: boolean;
}

const mockPromoCodes: PromoCode[] = [
  {
    code: 'WELCOME2024',
    type: 'welcome',
    value: '1 kostenlose Analyse',
    description: 'Willkommens-Bonus für neue Benutzer',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 'unlimited',
    currentUses: 247,
    isActive: true
  },
  {
    code: 'NEWRESTAURANT',
    type: 'welcome',
    value: '3 kostenlose Analysen',
    description: 'Starter-Paket für Restaurant-Neukunden',
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 500,
    currentUses: 89,
    isActive: true
  },
  {
    code: 'BUSINESS14',
    type: 'business',
    value: '14 Tage Business-Features',
    description: 'Test-Zugang zu erweiterten Features',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 100,
    currentUses: 23,
    isActive: true
  },
  {
    code: 'BLACKFRIDAY',
    type: 'marketing',
    value: '60% Rabatt alle Pläne',
    description: 'Black Friday Special Offer',
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    redemptionWindow: 5,
    maxUses: 1000,
    currentUses: 456,
    isActive: true
  },
  {
    code: 'EXPIRED2023',
    type: 'marketing',
    value: '50% Rabatt',
    description: 'Abgelaufener Marketing-Code',
    validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    redemptionWindow: 10,
    maxUses: 100,
    currentUses: 67,
    isActive: false
  }
];

export function PromoCodeSystem({ userPlan, onUpgrade, isAdmin = false }: PromoCodeSystemProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validationStatus, setValidationStatus] = useState<'none' | 'success' | 'error' | 'expired' | 'used'>('none');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    sent: 5,
    redeemed: 2,
    earnings: 4.00,
    nextPayout: 25.00
  });

  // Mock QR code URL - in real app this would be generated
  const referralQRCode = `https://app.visibilitycheck.com/ref/${btoa('user123').replace(/[+/=]/g, '')}`;
  const referralLink = `https://app.visibilitycheck.com/signup?ref=USER123`;

  const validatePromoCode = (code: string): PromoCode | null => {
    const foundCode = mockPromoCodes.find(
      p => p.code.toUpperCase() === code.toUpperCase() && p.isActive
    );
    
    if (!foundCode) return null;
    
    // Check if expired
    if (new Date() > foundCode.validUntil) {
      setValidationStatus('expired');
      return null;
    }
    
    // Check if usage limit reached
    if (foundCode.maxUses !== 'unlimited' && foundCode.currentUses >= foundCode.maxUses) {
      setValidationStatus('used');
      return null;
    }
    
    return foundCode;
  };

  const handlePromoSubmit = () => {
    if (!promoCode.trim()) return;
    
    const validCode = validatePromoCode(promoCode);
    
    if (validCode) {
      setValidationStatus('success');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validCode.redemptionWindow);
      
      setAppliedPromo({
        code: validCode.code,
        type: validCode.type,
        value: validCode.value,
        appliedAt: new Date(),
        expiresAt
      });
      
      // Clear input after successful redemption
      setTimeout(() => {
        setPromoCode('');
        setValidationStatus('none');
      }, 3000);
    } else {
      if (validationStatus === 'none') {
        setValidationStatus('error');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In real app, show toast notification
    console.log('Copied to clipboard:', text);
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
      case 'welcome': return 'text-success';
      case 'business': return 'text-primary';
      case 'marketing': return 'text-warning';
      case 'referral': return 'text-purple-600';
      case 'custom': return 'text-gray-600';
      default: return 'text-muted-foreground';
    }
  };

  const getValidationMessage = () => {
    switch (validationStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-success" />,
          message: `✅ ${promoCode.toUpperCase()} eingelöst!`,
          color: 'text-success'
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4 text-error" />,
          message: '❌ Code ungültig oder abgelaufen',
          color: 'text-error'
        };
      case 'expired':
        return {
          icon: <Clock className="w-4 h-4 text-warning" />,
          message: '⏰ Code-Einlösefrist (10 Tage) abgelaufen',
          color: 'text-warning'
        };
      case 'used':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-warning" />,
          message: '⚠️ Code bereits verwendet oder Limit erreicht',
          color: 'text-warning'
        };
      default:
        return null;
    }
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="space-y-6">
      {/* Promo Code Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">🎁 Haben Sie einen Promo-Code?</h3>
            <p className="text-sm text-muted-foreground">
              Codes einlösen für zusätzliche Analysen oder Rabatte
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Code eingeben"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.replace(/\s/g, '').toUpperCase())}
              className={`flex-1 ${
                validationStatus === 'success' ? 'border-success' : 
                validationStatus === 'error' || validationStatus === 'expired' || validationStatus === 'used' ? 'border-error' : ''
              }`}
              onKeyPress={(e) => e.key === 'Enter' && handlePromoSubmit()}
            />
            <Button 
              onClick={handlePromoSubmit}
              disabled={!promoCode.trim()}
              className={validationStatus === 'success' ? 'bg-success hover:bg-success/90' : ''}
            >
              {validationStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                'Code einlösen'
              )}
            </Button>
          </div>

          {validationMessage && (
            <div className={`flex items-center gap-2 text-sm ${validationMessage.color}`}>
              {validationMessage.icon}
              <span>{validationMessage.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Wo finde ich Codes?</span>
            <Button variant="link" size="sm" className="p-0 h-auto text-primary">
              <ExternalLink className="w-3 h-3 mr-1" />
              Hilfe-Center
            </Button>
          </div>
        </div>
      </Card>

      {/* Applied Promo Status */}
      {appliedPromo && (
        <Card className="p-6 border-success/20 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              {getCodeIcon(appliedPromo.type)}
            </div>
            <div>
              <h4 className="font-semibold text-success">🎉 Code aktiv</h4>
              <p className="text-sm text-muted-foreground">
                {appliedPromo.value} freigeschaltet
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Code:</span>
              <span className="font-medium font-mono">{appliedPromo.code}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Eingelöst am:</span>
              <span>{appliedPromo.appliedAt.toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>⏰ Verfällt am:</span>
              <span className="font-medium">
                {appliedPromo.expiresAt.toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Referral Marketing */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">👥 Empfehlen Sie einen Freund</h3>
            <p className="text-sm text-muted-foreground">
              Verdienen Sie €2 pro erfolgreiche Registrierung
            </p>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{referralStats.sent}</div>
            <div className="text-xs text-muted-foreground">Gesendet</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-success">{referralStats.redeemed}</div>
            <div className="text-xs text-muted-foreground">Eingelöst</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-warning">€{referralStats.earnings.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Verdient</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">€{referralStats.nextPayout.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Nächste Rechnung</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowReferralModal(true)}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            QR-Code teilen
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => copyToClipboard(referralLink)}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Link kopieren
          </Button>
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm">
            <div className="font-medium mb-1">💰 Aktuelles Guthaben: €{referralStats.earnings.toFixed(2)}</div>
            <div className="text-muted-foreground">
              📊 Guthaben wird von Ihrer Subscription abgezogen (Nächste Rechnung: €{referralStats.nextPayout.toFixed(2)} statt €29)
            </div>
          </div>
        </div>
      </Card>

      {/* Available Codes (if admin) */}
      {isAdmin && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">🔧 Verfügbare Codes (Admin View)</h3>
              <p className="text-sm text-muted-foreground">
                Alle aktiven Promo-Codes im System
              </p>
            </div>
            <Badge variant="secondary">Admin Only</Badge>
          </div>

          <div className="space-y-3">
            {mockPromoCodes.filter(code => code.isActive).map((code, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCodeColor(code.type)} bg-current/10`}>
                    {getCodeIcon(code.type)}
                  </div>
                  <div>
                    <div className="font-medium font-mono">{code.code}</div>
                    <div className="text-sm text-muted-foreground">{code.value}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {code.maxUses === 'unlimited' ? '∞' : `${code.currentUses}/${code.maxUses}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bis {code.validUntil.toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Example Codes */}
      <Card className="p-6 bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">✨ Beispiel-Codes zum Testen</h3>
            <p className="text-sm text-muted-foreground">
              Probieren Sie diese Demo-Codes aus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { code: 'WELCOME2024', desc: 'Willkommens-Bonus' },
            { code: 'BUSINESS14', desc: '14 Tage Business-Test' },
            { code: 'BLACKFRIDAY', desc: '60% Rabatt' },
            { code: 'EXPIRED2023', desc: 'Abgelaufener Code (Test)' }
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setPromoCode(example.code)}
              className="text-left p-3 bg-background rounded-lg border hover:border-warning/50 transition-all"
            >
              <div className="font-medium font-mono text-sm">{example.code}</div>
              <div className="text-xs text-muted-foreground">{example.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Referral QR Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR-Code für Empfehlungen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center">
            {/* Mock QR Code - in real app this would be generated */}
            <div className="w-48 h-48 mx-auto bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center">
                <QrCode className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">QR-Code wird hier generiert</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Teilen Sie diesen QR-Code</h4>
                <p className="text-sm text-muted-foreground">
                  Schenken Sie eine kostenlose Sichtbarkeitsanalyse (€5 Wert)
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Referral-Link:</div>
                <div className="text-sm font-mono break-all">{referralLink}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  LinkedIn
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                💰 Sie erhalten €2 Gutschrift pro erfolgreiche Registrierung
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}