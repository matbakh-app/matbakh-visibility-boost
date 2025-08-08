import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  BarChart3,
  PlayCircle,
  Zap,
  Target,
  TrendingUp,
  Gift,
  Globe
} from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';

/**
 * Demo Component showing how actual text values should appear in Figma
 * This component demonstrates the real German/English text content
 * that should replace i18n-keys in Figma designs
 */
export function FigmaTextDemo() {
  const { language } = useI18n();

  // Real text values that should be used in Figma
  const textValues = {
    de: {
      header: "Visibility Check",
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
      codeButton: "Code einlösen"
    },
    en: {
      header: "Visibility Check",
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
      codeButton: "Redeem code"
    }
  };

  const t = textValues[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header - uses global LanguageSwitch */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">{t.header}</h1>
            </div>
            
            {/* Language Switch - positioned on the right */}
            <LanguageSwitch variant="compact" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Figma Demo Info */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2">🎨 Figma Text Values Demo</h2>
            <p className="text-sm text-muted-foreground">
              Diese echten Textwerte sollten in Figma verwendet werden (anstatt i18n-Keys)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Aktuell in Figma:</strong>
              <code className="block bg-muted p-2 rounded mt-1">landing.title</code>
              <code className="block bg-muted p-2 rounded mt-1">landing.subtitle</code>
            </div>
            <div>
              <strong>Soll ersetzt werden mit:</strong>
              <div className="bg-success/10 p-2 rounded mt-1">{t.heroTitle}</div>
              <div className="bg-success/10 p-2 rounded mt-1">{t.heroSubtitle}</div>
            </div>
          </div>
        </Card>

        {/* Hero Section with real text values */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="space-y-8">
          {/* Block 1: Free Analysis - Real Text Values */}
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
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
              >
                <Zap className="w-5 h-5 mr-2" />
                {t.freeAnalysisButton}
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                {t.freeAnalysisInfo}
              </p>
            </div>
          </Card>

          {/* Block 2: Code Input - Real Text Values */}
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
                  className="flex-1 text-center"
                />
                <Button>
                  {t.codeButton}
                </Button>
              </div>
            </div>
          </Card>

          {/* Figma Implementation Guide */}
          <Card className="p-6 bg-muted/20 border-dashed">
            <h3 className="font-semibold mb-4">📋 Figma Implementation Guide</h3>
            <div className="space-y-4 text-sm">
              <div>
                <strong>1. Component Variants erstellen:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Variant Property: <code>language = de / en</code></li>
                  <li>• Auto-Layout aktiviert für responsive Text-Anpassung</li>
                  <li>• Text-Styles: Inter für Headlines, System-Font für Body</li>
                </ul>
              </div>
              
              <div>
                <strong>2. LanguageSwitch verknüpfen:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Interaction: On Click → Change to → Variant (language=en/de)</li>
                  <li>• Transition: Smart Animate, 200ms Ease-Out</li>
                </ul>
              </div>

              <div>
                <strong>3. Text-Elemente ersetzen:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Entferne alle i18n-Keys (z.B. "landing.title")</li>
                  <li>• Ersetze mit echten Textwerten aus der Mapping-Dokumentation</li>
                  <li>• Erstelle DE/EN Variants für jeden Text-Layer</li>
                </ul>
              </div>

              <div>
                <strong>4. Frame-Kommentare:</strong>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• "Landing Page - uses global LanguageSwitch"</li>
                  <li>• "Restaurant Info Step - uses global LanguageSwitch"</li>
                  <li>• "Website Analysis Step - uses global LanguageSwitch"</li>
                  <li>• "AI Loading Screen - uses global LanguageSwitch"</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}