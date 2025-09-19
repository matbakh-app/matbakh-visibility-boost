import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  ArrowLeft, 
  Globe, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  Info,
  BarChart3,
  Target,
  Gift,
  Crown,
  Sparkles
} from 'lucide-react';
import { WebsiteAnalysisFormData, GuestCodeInfo } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface WebsiteAnalysisStepProps {
  onNext: (data: WebsiteAnalysisFormData) => void;
  onBack: () => void;
  guestCodeInfo?: GuestCodeInfo | null;
  emailConfirmed?: boolean;
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

export function WebsiteAnalysisStep({ 
  onNext, 
  onBack, 
  guestCodeInfo = null,
  emailConfirmed = false
}: WebsiteAnalysisStepProps) {
  const { language } = useI18n();
  const [formData, setFormData] = useState<WebsiteAnalysisFormData>({
    website: '',
    benchmarks: {
      benchmark1: '',
      benchmark2: '',
      benchmark3: ''
    },
    email: '',
    privacyAccepted: false,
    emailReportAccepted: false,
    marketingAccepted: false,
    emailConfirmed: emailConfirmed
  });

  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [codeValidationState, setCodeValidationState] = useState<'idle' | 'validating' | 'success' | 'error' | 'expired' | 'used'>('idle');
  const [validatedCodeInfo, setValidatedCodeInfo] = useState<GuestCodeInfo | null>(null);
  const [showPromoSuccess, setShowPromoSuccess] = useState(false);

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      title: "Website & Analyse-Einstellungen",
      back: "Zurück",
      step: "Schritt 2 von 2",
      headline: "Website & Vergleiche",
      websiteLabel: "Website (optional)",
      websitePlaceholder: "https://meinrestaurant.de",
      benchmarksLabel: "Vergleichbare Unternehmen (Benchmarks)",
      benchmarksDesc: "Tragen Sie bis zu 3 Lokale ein, mit denen Sie sich vergleichen möchten.",
      benchmark1Placeholder: "z. B. Weinbar X in München",
      benchmark2Placeholder: "optional",
      emailTitle: "E-Mail & Datenschutz",
      emailDesc: "Für den PDF-Report und weitere Analysen benötigen wir Ihre E-Mail-Adresse.",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "ihre.email@beispiel.de",
      emailGuestSkip: "E-Mail-Bestätigung wird für Premium-Codes übersprungen",
      privacyLabel: "Datenschutz-Einverständnis",
      privacyText: "Ich stimme der Verarbeitung meiner Daten für die Sichtbarkeits-Analyse zu.",
      privacyRequired: "Erforderlich",
      emailReportLabel: "E-Mail Report Einverständnis",
      emailReportText: "Ich stimme zu, dass der PDF-Report an meine E-Mail-Adresse gesendet wird.",
      emailReportRequired: "Erforderlich",
      marketingLabel: "Marketing-Einverständnis",
      marketingText: "Ich möchte über neue Features und Gastro-Tipps informiert werden.",
      marketingOptional: "Optional",
      warningTitle: "Wichtig",
      warningText: "Sie erhalten eine Bestätigungs-E-Mail. Erst nach Bestätigung wird der vollständige Report generiert und versendet.",
      confirmEmail: "Bestätigungs-E-Mail senden",
      emailSending: "Bestätigungs-E-Mail wird gesendet...",
      emailSent: "E-Mail versendet",
      emailSentText: "Wir haben eine Bestätigungs-E-Mail an",
      emailClickLink: "Klicken Sie auf den Link in der E-Mail, um fortzufahren.",
      emailAlreadyConfirmed: "Bereits bestätigt? Hier klicken",
      emailConfirmed: "E-Mail bestätigt",
      emailCanStart: "Sie können nun die Analyse starten.",
      startAnalysis: "Analyse starten",
      backToStep1: "Zurück zu Step 1",
      // Promo code texts
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
      codeStartPremium: "Premium-Analyse starten"
    },
    en: {
      headerTitle: "Start Visibility Check",
      title: "Website & Analysis Settings",
      back: "Back",
      step: "Step 2 of 2", 
      headline: "Website & Comparisons",
      websiteLabel: "Website (optional)",
      websitePlaceholder: "https://myrestaurant.com",
      benchmarksLabel: "Comparable Businesses (Benchmarks)",
      benchmarksDesc: "Enter up to 3 businesses you want to compare with.",
      benchmark1Placeholder: "e.g. Wine Bar X in New York",
      benchmark2Placeholder: "optional",
      emailTitle: "E-Mail & Privacy",
      emailDesc: "We need your email address for the PDF report and further analyses.",
      emailLabel: "E-Mail Address",
      emailPlaceholder: "your.email@example.com",
      emailGuestSkip: "Email confirmation skipped for premium codes",
      privacyLabel: "Privacy Consent",
      privacyText: "I agree to the processing of my data for the visibility analysis.",
      privacyRequired: "Required",
      emailReportLabel: "Email Report Consent", 
      emailReportText: "I agree that the PDF report will be sent to my email address.",
      emailReportRequired: "Required",
      marketingLabel: "Marketing Consent",
      marketingText: "I want to be informed about new features and restaurant tips.",
      marketingOptional: "Optional",
      warningTitle: "Important",
      warningText: "You will receive a confirmation email. The full report will only be generated after confirmation.",
      confirmEmail: "Send confirmation email",
      emailSending: "Sending confirmation email...",
      emailSent: "Email sent",
      emailSentText: "We have sent a confirmation email to",
      emailClickLink: "Click the link in the email to continue.",
      emailAlreadyConfirmed: "Already confirmed? Click here",
      emailConfirmed: "Email confirmed",
      emailCanStart: "You can now start the analysis.",
      startAnalysis: "Start analysis",
      backToStep1: "Back to Step 1",
      // Promo code texts
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
      codeStartPremium: "Start Premium Analysis"
    }
  };

  const t = texts[language];

  // Check for URL parameter to simulate email confirmation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmed = urlParams.get('confirmed');
    if (confirmed === 'true') {
      setFormData(prev => ({ ...prev, emailConfirmed: true }));
    }
  }, []);

  const handleInputChange = (field: keyof WebsiteAnalysisFormData | string, value: string | boolean) => {
    if (field.startsWith('benchmark')) {
      setFormData(prev => ({
        ...prev,
        benchmarks: {
          ...prev.benchmarks,
          [field]: value as string
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const isFormValid = () => {
    return formData.email.trim() && 
           formData.privacyAccepted && 
           formData.emailReportAccepted &&
           (guestCodeInfo || validatedCodeInfo || formData.emailConfirmed);
  };

  const handleSendConfirmation = async () => {
    setIsSubmitting(true);
    
    try {
      // Import the VC service to send the visibility check request
      const { startVisibilityCheck } = await import('../../../services/vc');
      
      await startVisibilityCheck(
        formData.email,
        undefined, // name is optional for VC
        formData.marketingAccepted,
        language
      );
      
      setEmailSent(true);
      console.log('Visibility check confirmation email sent to:', formData.email);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Still show success to avoid revealing system details
      setEmailSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onNext(formData);
  };

  // Promo code validation
  const handleValidateCode = async () => {
    if (!promoCode.trim()) return;

    setCodeValidationState('validating');

    // Simulate API call
    setTimeout(() => {
      const codeInfo = PROMO_CODES[promoCode.toUpperCase()];
      
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
      setShowPromoSuccess(true);
    }, 1500);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header with Language & Theme Switch */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="btn-hover-enhanced">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{t.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {(guestCodeInfo || validatedCodeInfo) && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Gift className="w-3 h-3 mr-1" />
                  Premium-Code aktiv
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Guest Code Info */}
        {(guestCodeInfo || validatedCodeInfo) && (
          <Alert className="mb-8 border-success/20 bg-success/5 theme-transition">
            <Crown className="h-4 w-4 text-success" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>✅ Premium-Analyse aktiviert von {(guestCodeInfo || validatedCodeInfo)?.referrerName}</strong>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t.emailGuestSkip}
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-success" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t.headline}</h2>
            <div className="text-sm text-muted-foreground">
              {t.step}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300 w-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Promo Code Section - MOVED FROM LANDING PAGE */}
          {!guestCodeInfo && !validatedCodeInfo && (
            <Card className="p-6 border-2 border-success/20 bg-gradient-to-r from-success/5 to-primary/5 card-dark-enhanced">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t.codeTitle}</h3>
                <p className="text-muted-foreground text-sm">
                  {t.codeSubtitle}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder={t.codePlaceholder}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 text-center input-dark-enhanced"
                    disabled={codeValidationState === 'validating'}
                  />
                  <Button 
                    onClick={handleValidateCode}
                    disabled={!promoCode.trim() || codeValidationState === 'validating'}
                    className="btn-hover-enhanced"
                  >
                    {t.codeButton}
                  </Button>
                </div>

                {/* Validation Message */}
                {validationMessage && (
                  <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm theme-transition ${validationMessage.className}`}>
                    {validationMessage.icon}
                    {validationMessage.text}
                  </div>
                )}

                {/* Success State with Code Benefits */}
                {showPromoSuccess && validatedCodeInfo && (
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20 theme-transition">
                    <div className="text-center mb-4">
                      <Crown className="w-12 h-12 text-success mx-auto mb-2" />
                      <h4 className="font-semibold text-success mb-2">
                        {t.codeSuccessConfirm}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t.codeValidUntil}: {validatedCodeInfo.validUntil.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium mb-2 text-sm">{t.codeBenefits}</h5>
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
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Website Card */}
          <Card className="p-6 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t.headline}</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="website">{t.websiteLabel}</Label>
                <Input
                  id="website"
                  placeholder={t.websitePlaceholder}
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full input-dark-enhanced"
                />
              </div>

              <div className="space-y-4">
                <Label>{t.benchmarksLabel}</Label>
                <p className="text-sm text-muted-foreground">{t.benchmarksDesc}</p>

                <div className="space-y-4">
                  {[1, 2, 3].map((num) => (
                    <Input
                      key={num}
                      placeholder={num === 1 ? t.benchmark1Placeholder : t.benchmark2Placeholder}
                      value={formData.benchmarks[`benchmark${num}` as keyof typeof formData.benchmarks]}
                      onChange={(e) => handleInputChange(`benchmark${num}`, e.target.value)}
                      className="input-dark-enhanced"
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Email Card */}
          <Card className="p-6 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold">{t.emailTitle}</h3>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">{t.emailDesc}</p>

              <div className="space-y-2">
                <Label htmlFor="email">{t.emailLabel} *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full input-dark-enhanced"
                  required
                />
              </div>

              {/* Enhanced Checkbox Section with Better Visibility */}
              <div className="space-y-4">
                {/* Privacy Consent - Required */}
                <div className="checkbox-container-enhanced">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) => handleInputChange('privacyAccepted', checked as boolean)}
                    className="checkbox-enhanced mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer font-medium">
                      {t.privacyLabel} *
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-error/10 text-error border border-error/20">
                        {t.privacyRequired}
                      </span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.privacyText}
                    </p>
                  </div>
                </div>

                {/* Email Report Consent - Required */}
                <div className="checkbox-container-enhanced">
                  <Checkbox
                    id="emailReport"
                    checked={formData.emailReportAccepted}
                    onCheckedChange={(checked) => handleInputChange('emailReportAccepted', checked as boolean)}
                    className="checkbox-enhanced mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="emailReport" className="text-sm leading-relaxed cursor-pointer font-medium">
                      {t.emailReportLabel} *
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-error/10 text-error border border-error/20">
                        {t.emailReportRequired}
                      </span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.emailReportText}
                    </p>
                  </div>
                </div>

                {/* Marketing Consent - Optional */}
                <div className="checkbox-container-enhanced">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketingAccepted}
                    onCheckedChange={(checked) => handleInputChange('marketingAccepted', checked as boolean)}
                    className="checkbox-enhanced mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="marketing" className="text-sm leading-relaxed cursor-pointer font-medium">
                      {t.marketingLabel}
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground border">
                        {t.marketingOptional}
                      </span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.marketingText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Alert Box */}
              <Alert className="bg-[#FEF3C7] border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-[#374151]">
                  <strong>{t.warningTitle}:</strong> {t.warningText}
                </AlertDescription>
              </Alert>

              {/* Guest User Start Button */}
              {(guestCodeInfo || validatedCodeInfo) && (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.email.trim() || !formData.privacyAccepted || !formData.emailReportAccepted}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.startAnalysis}
                </Button>
              )}

              {/* Email Confirmation for Non-Guest Users */}
              {!guestCodeInfo && !validatedCodeInfo && (
                <div className="space-y-4">
                  {!emailSent && !formData.emailConfirmed && (
                    <Button
                      onClick={handleSendConfirmation}
                      disabled={!formData.email.trim() || isSubmitting}
                      variant="outline"
                      className="w-full btn-hover-enhanced"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary mr-2" />
                          {t.emailSending}
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          {t.confirmEmail}
                        </>
                      )}
                    </Button>
                  )}

                  {emailSent && !formData.emailConfirmed && (
                    <Alert className="border-primary bg-primary/5">
                      <Mail className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <strong>{t.emailSent}!</strong><br />
                        {t.emailSentText} <strong>{formData.email}</strong>. {t.emailClickLink}
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, emailConfirmed: true }))}
                            className="btn-hover-enhanced"
                          >
                            {t.emailAlreadyConfirmed}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {formData.emailConfirmed && (
                    <Alert className="border-success bg-success/5">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <AlertDescription>
                        <strong>{t.emailConfirmed}!</strong> {t.emailCanStart}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button for Regular Users */}
          {!guestCodeInfo && !validatedCodeInfo && (
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex items-center gap-2 btn-hover-enhanced"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToStep1}
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid()}
                size="lg"
                className="min-w-48 bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
              >
                <Target className="w-4 h-4 mr-2" />
                {t.startAnalysis}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}