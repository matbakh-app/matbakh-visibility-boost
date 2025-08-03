import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
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
  Sparkles,
  Home
} from 'lucide-react';
import { WebsiteAnalysisFormData, GuestCodeInfo } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface WebsiteAnalysisStepProps {
  onNext: (data: WebsiteAnalysisFormData) => void;
  onBack: () => void;
  guestCodeInfo?: GuestCodeInfo | null;
  emailConfirmed?: boolean;
}

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

  // Real text values based on language - CORRECTED: Direct text values instead of i18n keys
  const texts = {
    de: {
      headerTitle: "Visibility Check",
      title: "Website & Analyse-Einstellungen",
      breadcrumbHome: "Home",
      breadcrumbRestaurant: "Restaurant Information", 
      breadcrumbCurrent: "Website & Analyse",
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
      emailReportLabel: "E-Mail Report Einverständnis",
      emailReportText: "Ich stimme zu, dass der PDF-Report an meine E-Mail-Adresse gesendet wird.",
      marketingLabel: "Marketing-Einverständnis (optional)",
      marketingText: "Ich möchte über neue Features und Gastro-Tipps informiert werden.",
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
      backToStep1: "Zurück zu Step 1"
    },
    en: {
      headerTitle: "Visibility Check",
      title: "Website & Analysis Settings",
      breadcrumbHome: "Home",
      breadcrumbRestaurant: "Restaurant Information",
      breadcrumbCurrent: "Website & Analysis",
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
      emailReportLabel: "Email Report Consent", 
      emailReportText: "I agree that the PDF report will be sent to my email address.",
      marketingLabel: "Marketing Consent (optional)",
      marketingText: "I want to be informed about new features and restaurant tips.",
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
      backToStep1: "Back to Step 1"
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
           (guestCodeInfo || formData.emailConfirmed); // Guest users skip email confirmation
  };

  const handleSendConfirmation = () => {
    setIsSubmitting(true);
    
    // Simulate sending confirmation email
    setTimeout(() => {
      setEmailSent(true);
      setIsSubmitting(false);
      console.log('Confirmation email sent to:', formData.email);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    
    onNext(formData);
  };

  // Navigation handler for breadcrumb - CORRECTED: Always go to /vc
  const handleBackToVCLanding = () => {
    // In a real router implementation, we'd use router.push('/vc')
    window.location.href = '/vc';
  };

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: t.breadcrumbHome,
      icon: <Home className="w-4 h-4" />,
      onClick: handleBackToVCLanding
    },
    {
      label: t.breadcrumbRestaurant,
      onClick: onBack
    },
    {
      label: t.breadcrumbCurrent,
      isActive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header with Language Switch - uses global LanguageSwitch */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToVCLanding}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">{t.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {guestCodeInfo && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Gift className="w-3 h-3 mr-1" />
                  Premium-Code aktiv
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-2">›</span>
                )}
                <button
                  onClick={item.onClick}
                  className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                    item.isActive ? 'text-foreground font-medium' : ''
                  }`}
                  disabled={item.isActive}
                >
                  {item.icon}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Guest Code Info */}
        {guestCodeInfo && (
          <Alert className="mb-8 border-success/20 bg-success/5">
            <Crown className="h-4 w-4 text-success" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>✅ Premium-Analyse aktiviert von {guestCodeInfo.referrerName}</strong>
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
          {/* Website & Vergleiche Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t.headline}</h3>
            </div>

            <div className="space-y-6">
              {/* Website Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="website">{t.websiteLabel}</Label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="website"
                  placeholder={t.websitePlaceholder}
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Benchmark Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>{t.benchmarksLabel}</Label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.benchmarksDesc}
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="benchmark1" className="text-sm">Benchmark 1</Label>
                    <Input
                      id="benchmark1"
                      placeholder={t.benchmark1Placeholder}
                      value={formData.benchmarks.benchmark1}
                      onChange={(e) => handleInputChange('benchmark1', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="benchmark2" className="text-sm">Benchmark 2</Label>
                    <Input
                      id="benchmark2"
                      placeholder={t.benchmark2Placeholder}
                      value={formData.benchmarks.benchmark2}
                      onChange={(e) => handleInputChange('benchmark2', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="benchmark3" className="text-sm">Benchmark 3</Label>
                    <Input
                      id="benchmark3"
                      placeholder={t.benchmark2Placeholder}
                      value={formData.benchmarks.benchmark3}
                      onChange={(e) => handleInputChange('benchmark3', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* E-Mail & Datenschutz Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold">{t.emailTitle}</h3>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t.emailDesc}
              </p>

              {/* Email Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email">{t.emailLabel} *</Label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) => handleInputChange('privacyAccepted', checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                    <strong>{t.privacyLabel} *</strong><br />
                    {t.privacyText} <a href="#" className="text-primary underline">Datenschutzerklärung</a>
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="emailReport"
                    checked={formData.emailReportAccepted}
                    onCheckedChange={(checked) => handleInputChange('emailReportAccepted', checked as boolean)}
                  />
                  <Label htmlFor="emailReport" className="text-sm leading-relaxed cursor-pointer">
                    <strong>{t.emailReportLabel} *</strong><br />
                    {t.emailReportText}
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={formData.marketingAccepted}
                    onCheckedChange={(checked) => handleInputChange('marketingAccepted', checked as boolean)}
                  />
                  <Label htmlFor="marketing" className="text-sm leading-relaxed cursor-pointer">
                    <strong>{t.marketingLabel}</strong><br />
                    {t.marketingText}
                  </Label>
                </div>
              </div>

              {/* Warning Alert Box - CORRECTED with specified styling and real German text */}
              <Alert className="bg-[#FEF3C7] border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-[#374151]">
                  <strong>{t.warningTitle}:</strong> {t.warningText}
                </AlertDescription>
              </Alert>

              {/* Guest User Start Button */}
              {guestCodeInfo && (
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.email.trim() || !formData.privacyAccepted || !formData.emailReportAccepted}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    style={{ padding: '8px 16px' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t.startAnalysis}
                  </Button>
                </div>
              )}

              {/* Email Confirmation Status for Non-Guest Users */}
              {!guestCodeInfo && (
                <div className="space-y-4">
                  {!emailSent && !formData.emailConfirmed && (
                    <Button
                      onClick={handleSendConfirmation}
                      disabled={!formData.email.trim() || isSubmitting}
                      variant="outline"
                      className="w-full"
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
                        {t.emailSentText} <strong>{formData.email}</strong>. 
                        {t.emailClickLink}
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, emailConfirmed: true }))}
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
                      <AlertDescription className="text-success-foreground">
                        <strong>{t.emailConfirmed}!</strong> {t.emailCanStart}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Submit Button for Regular Users */}
          {!guestCodeInfo && (
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToStep1}
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid()}
                size="lg"
                className="min-w-48 bg-primary hover:bg-primary/90 text-white"
                style={{ padding: '8px 16px' }}
              >
                <Target className="w-4 h-4 mr-2" />
                {t.startAnalysis}
              </Button>
            </div>
          )}

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="p-4 bg-muted/50 border-dashed">
              <div className="text-xs text-muted-foreground mb-2">
                🌐 <strong>Echte Texte implementiert:</strong> Keine i18n-Keys mehr • Alert-Box korrekt • DE/EN Sprachwechsel
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Simuliere E-Mail-Bestätigung:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, emailConfirmed: true }))}
                    className="mt-1"
                  >
                    E-Mail als bestätigt markieren
                  </Button>
                </div>
                <div>
                  <p className="text-muted-foreground">URL für Bestätigung:</p>
                  <code className="text-xs bg-background p-1 rounded">
                    ?confirmed=true
                  </code>
                  <div className="mt-1">
                    <strong>Sprache:</strong> {language === 'de' ? 'Deutsch 🇩🇪' : 'English 🇺🇸'}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}