import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  Globe, 
  Target, 
  Zap, 
  UtensilsCrossed, 
  Gift,
  BarChart3,
  PlayCircle,
  TrendingUp,
  Crown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users
} from 'lucide-react';
import { GuestCodeInfo } from '../types/app';
import { useI18n } from '../contexts/i18nContext';
import { getCodeFromURL } from '../utils/appHelpers';

interface GuestLandingPageProps {
  onCodeValidated: (codeInfo: GuestCodeInfo) => void;
  onContinueWithoutCode: () => void;
  onLogin: () => void;
}

// Promo code database for validation
const PROMO_CODES: Record<string, GuestCodeInfo> = {
  'OLIVIA2024XYZ': {
    code: 'OLIVIA2024XYZ',
    referrerName: 'Olivia Martinez',
    referrerEmail: 'o.martinez@restaurant-group.com',
    validUntil: new Date('2024-12-31'),
    isValid: true,
    features: ['premium_analysis', 'competitor_tracking', 'email_reports', 'priority_support']
  },
  'MARCO2024ABC': {
    code: 'MARCO2024ABC',
    referrerName: 'Marco Schmidt',
    referrerEmail: 'm.schmidt@gastro-consulting.de',
    validUntil: new Date('2024-11-30'),
    isValid: true,
    features: ['premium_analysis', 'email_reports']
  },
  'SARAH2024DEF': {
    code: 'SARAH2024DEF',
    referrerName: 'Sarah Weber',
    referrerEmail: 's.weber@marketing-agentur.com',
    validUntil: new Date('2024-10-31'),
    isValid: true,
    features: ['premium_analysis', 'competitor_tracking', 'priority_support']
  }
};

export function GuestLandingPage({ onCodeValidated, onContinueWithoutCode, onLogin }: GuestLandingPageProps) {
  const { language } = useI18n();
  const [promoCode, setPromoCode] = useState('');
  const [codeValidationState, setCodeValidationState] = useState<'idle' | 'validating' | 'success' | 'error' | 'expired' | 'used'>('idle');
  const [validatedCodeInfo, setValidatedCodeInfo] = useState<GuestCodeInfo | null>(null);
  const [showGuestSuccess, setShowGuestSuccess] = useState(false);

  // Real text values based on language - CORRECTED: Direct text values instead of i18n keys
  const texts = {
    de: {
      headerTitle: "Visibility Check",
      heroTitle: "Restaurant Sichtbarkeits-Analyse", 
      heroSubtitle: "Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse",
      freeAnalysisTitle: "Kostenlose Sichtbarkeitsanalyse starten",
      freeAnalysisSubtitle: "Basis-Analyse mit eingeschränkten Features",
      feature1Title: "Basis-Analyse",
      feature1Desc: "Grundlegende Sichtbarkeits-Überprüfung Ihrer wichtigsten Plattformen",
      feature2Title: "Schnelle Insights",
      feature2Desc: "Sofortige Ergebnisse zu Ihrer digitalen Präsenz",
      feature3Title: "Erste Empfehlungen", 
      feature3Desc: "Grundlegende Optimierungsvorschläge für bessere Sichtbarkeit",
      freeAnalysisButton: "Basis-Analyse starten",
      freeAnalysisInfo: "Kostenlos • Keine Registrierung erforderlich • 3-5 Minuten",
      codeTitle: "🎁 Haben Sie einen Gutschein-Code?",
      codeSubtitle: "Codes erhalten Sie von Partnern oder per Email für erweiterte Analysen",
      codePlaceholder: "Code eingeben",
      codeButton: "Code einlösen",
      codeValidating: "Code wird validiert...",
      codeSuccess: "Vollzugang freigeschaltet von",
      codeError: "Code ungültig oder abgelaufen",
      codeExpired: "Code-Einlösefrist abgelaufen",
      codeUsed: "Code bereits verwendet",
      codeSuccessConfirm: "🎉 Code erfolgreich eingelöst!",
      codeValidUntil: "Gültig bis",
      codeBenefits: "Mit Code freigeschaltet:",
      codeStartPremium: "Premium-Analyse starten",
      accountTitle: "Account erstellen",
      accountSubtitle: "Vollzugang mit persönlichem Dashboard",
      accountFeature1: "Gespeicherte Analyse-Historie",
      accountFeature2: "Monatliche Updates", 
      accountFeature3: "Erweiterte Features",
      accountButton: "Jetzt registrieren"
    },
    en: {
      headerTitle: "Visibility Check",
      heroTitle: "Restaurant Visibility Analysis",
      heroSubtitle: "Discover your online presence with AI-powered analysis", 
      freeAnalysisTitle: "Start Free Visibility Analysis",
      freeAnalysisSubtitle: "Basic analysis with limited features",
      feature1Title: "Basic Analysis",
      feature1Desc: "Essential visibility check of your main platforms",
      feature2Title: "Quick Insights",
      feature2Desc: "Instant results about your digital presence",
      feature3Title: "Initial Recommendations",
      feature3Desc: "Basic optimization suggestions for better visibility",
      freeAnalysisButton: "Start Basic Analysis", 
      freeAnalysisInfo: "Free • No registration required • 3-5 minutes",
      codeTitle: "🎁 Do you have a voucher code?",
      codeSubtitle: "Get codes from partners or via email for advanced analyses",
      codePlaceholder: "Enter code",
      codeButton: "Redeem code",
      codeValidating: "Validating code...",
      codeSuccess: "Full access unlocked by",
      codeError: "Code invalid or expired",
      codeExpired: "Code redemption period expired",
      codeUsed: "Code already used",
      codeSuccessConfirm: "🎉 Code successfully redeemed!",
      codeValidUntil: "Valid until",
      codeBenefits: "Unlocked with code:",
      codeStartPremium: "Start Premium Analysis",
      accountTitle: "Create Account",
      accountSubtitle: "Full access with personal dashboard",
      accountFeature1: "Saved analysis history",
      accountFeature2: "Monthly updates",
      accountFeature3: "Advanced features", 
      accountButton: "Register now"
    }
  };

  const t = texts[language];

  // Check for URL code parameter on component mount
  useEffect(() => {
    const urlCode = getCodeFromURL();
    if (urlCode) {
      setPromoCode(urlCode);
      handleValidateCode(urlCode);
    }
  }, []);

  const handleValidateCode = async (codeToValidate?: string) => {
    const code = codeToValidate || promoCode;
    if (!code.trim()) return;

    setCodeValidationState('validating');

    // Simulate API call
    setTimeout(() => {
      const codeInfo = PROMO_CODES[code.toUpperCase()];
      
      if (!codeInfo) {
        setCodeValidationState('error');
        return;
      }

      if (new Date() > codeInfo.validUntil) {
        setCodeValidationState('expired');
        return;
      }

      if (!codeInfo.isValid) {
        setCodeValidationState('used');
        return;
      }

      // Code is valid
      setCodeValidationState('success');
      setValidatedCodeInfo(codeInfo);
      setShowGuestSuccess(true);
    }, 1500);
  };

  const handleStartPremiumAnalysis = () => {
    if (validatedCodeInfo) {
      onCodeValidated(validatedCodeInfo);
    }
  };

  const getValidationMessage = () => {
    switch (codeValidationState) {
      case 'validating':
        return {
          icon: <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary" />,
          text: t.codeValidating,
          className: 'border-primary bg-primary/5 text-primary'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: `${t.codeSuccess} ${validatedCodeInfo?.referrerName}`,
          className: 'border-success bg-success/5 text-success'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: t.codeError,
          className: 'border-error bg-error/5 text-error'
        };
      case 'expired':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: t.codeExpired,
          className: 'border-warning bg-warning/5 text-warning'
        };
      case 'used':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: t.codeUsed,
          className: 'border-error bg-error/5 text-error'
        };
      default:
        return null;
    }
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header with Language Switch */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">{t.headerTitle}</h1>
            </div>
            
            <LanguageSwitch variant="compact" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="space-y-8">
          {/* Block 1: Kostenlose Sichtbarkeitsanalyse starten */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-success/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t.freeAnalysisTitle}</h2>
              <p className="text-muted-foreground">
                {t.freeAnalysisSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.feature1Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.feature1Desc}
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">{t.feature2Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.feature2Desc}
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">{t.feature3Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.feature3Desc}
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={onContinueWithoutCode}
                size="lg"
                className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90"
              >
                <Zap className="w-5 h-5 mr-2" />
                {t.freeAnalysisButton}
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                {t.freeAnalysisInfo}
              </p>
            </div>
          </Card>

          {/* Block 2: Promo-Code Section - MOVED directly under main card */}
          <Card className="p-8 border-2 border-success/20 bg-gradient-to-r from-success/5 to-primary/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t.codeTitle}</h2>
              <p className="text-muted-foreground">
                {t.codeSubtitle}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={t.codePlaceholder}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 text-center"
                  disabled={codeValidationState === 'validating'}
                />
                <Button 
                  onClick={() => handleValidateCode()}
                  disabled={!promoCode.trim() || codeValidationState === 'validating'}
                >
                  {t.codeButton}
                </Button>
              </div>

              {/* Validation Message */}
              {validationMessage && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${validationMessage.className}`}>
                  {validationMessage.icon}
                  {validationMessage.text}
                </div>
              )}

              {/* Success State with Code Benefits */}
              {showGuestSuccess && validatedCodeInfo && (
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="text-center mb-4">
                    <Crown className="w-12 h-12 text-success mx-auto mb-2" />
                    <h3 className="font-semibold text-success mb-2">
                      {t.codeSuccessConfirm}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.codeValidUntil}: {validatedCodeInfo.validUntil.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">{t.codeBenefits}</h4>
                    <ul className="text-sm space-y-1">
                      {validatedCodeInfo.features.includes('premium_analysis') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {language === 'de' ? 'Vollständige Premium-Analyse' : 'Complete Premium Analysis'}
                        </li>
                      )}
                      {validatedCodeInfo.features.includes('competitor_tracking') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {language === 'de' ? 'Competitor-Tracking inklusive' : 'Competitor Tracking included'}
                        </li>
                      )}
                      {validatedCodeInfo.features.includes('email_reports') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {language === 'de' ? 'Detaillierte PDF-Reports' : 'Detailed PDF Reports'}
                        </li>
                      )}
                      {validatedCodeInfo.features.includes('priority_support') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {language === 'de' ? 'Priority-Support' : 'Priority Support'}
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button 
                    onClick={handleStartPremiumAnalysis}
                    className="w-full bg-success hover:bg-success/90 text-white"
                    size="lg"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t.codeStartPremium}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Block 3: Account Creation */}
          <Card className="p-8 border-2 border-warning/20 bg-gradient-to-r from-warning/5 to-error/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t.accountTitle}</h2>
              <p className="text-muted-foreground">
                {t.accountSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">{t.accountFeature1}</h3>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-error" />
                </div>
                <h3 className="font-semibold mb-2">{t.accountFeature2}</h3>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.accountFeature3}</h3>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={onLogin}
                size="lg"
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
              >
                <UtensilsCrossed className="w-5 h-5 mr-2" />
                {t.accountButton}
              </Button>
            </div>
          </Card>

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="p-4 bg-muted/50 border-dashed">
              <div className="text-center text-sm text-muted-foreground">
                🌐 <strong>Echte Texte implementiert:</strong> Keine i18n-Keys mehr • DE/EN Sprachwechsel funktional • LanguageSwitch aktiv
              </div>
              <div className="flex justify-center mt-2">
                <span className="text-xs bg-success/10 px-2 py-1 rounded">
                  Aktuelle Sprache: {language === 'de' ? 'Deutsch 🇩🇪' : 'English 🇺🇸'}
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}