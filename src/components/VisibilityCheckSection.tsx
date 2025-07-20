import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Phone, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VisibilityCheckSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [showResult, setShowResult] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const handleCheck = async () => {
    if (businessName && location && email) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('places-visibility-check', {
          body: {
            businessName,
            location,
            email,
            website: website || undefined
          }
        });

        if (error) {
          console.error('Error calling visibility check:', error);
          setAnalysisData({
            found: false,
            error: 'Fehler bei der Analyse. Bitte versuchen Sie es später erneut.'
          });
        } else {
          setAnalysisData(data);
        }
        setShowResult(true);
      } catch (error) {
        console.error('Network error:', error);
        setAnalysisData({
          found: false,
          error: 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.'
        });
        setShowResult(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hallo! Ich möchte eine kostenlose Sichtbarkeits-Analyse für mein Restaurant "${businessName}" in ${location}. Meine E-Mail: ${email}${website ? ', Website: ' + website : ''}. Können Sie mir dabei helfen?`
    );
    window.open(`https://wa.me/4915123456789?text=${message}`, '_blank');
  };

  return (
    <section className="py-20 bg-primary/5 visibility-check-section">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('visibilityCheck.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Jetzt mit Google & Facebook Analyse
          </p>
        </div>

        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-black">
              {t('visibilityCheck.formTitle')}
            </CardTitle>
            <p className="text-gray-600">
              Google Business Profile & Facebook Seite werden geprüft
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showResult ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('visibilityCheck.businessNameLabel')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('visibilityCheck.businessNamePlaceholder')}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('visibilityCheck.locationLabel')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('visibilityCheck.locationPlaceholder')}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('visibilityCheck.emailLabel')}
                    </label>
                    <Input
                      type="email"
                      placeholder={t('visibilityCheck.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('visibilityCheck.websiteLabel')}
                    </label>
                    <Input
                      type="url"
                      placeholder={t('visibilityCheck.websitePlaceholder')}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleCheck}
                  disabled={!businessName || !location || !email || isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 mr-2" />
                  )}
                  {isLoading ? 'Analyse läuft...' : 'Google & Facebook prüfen'}
                </Button>
              </>
            ) : (
              <div className="space-y-6">
                {/* Error handling */}
                {analysisData?.error && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-black mb-2">
                      Fehler bei der Analyse
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {analysisData.error}
                    </p>
                  </div>
                )}

                {/* Success results */}
                {analysisData && !analysisData.error && (
                  <>
                    <div className="text-center">
                      <div className={`w-16 h-16 ${analysisData.found ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Search className={`h-8 w-8 ${analysisData.found ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {analysisData.found ? 'Multi-Platform Analyse abgeschlossen!' : 'Profile nicht gefunden'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {analysisData.found 
                          ? `Google & Facebook Ergebnisse für "${businessName}" in ${location}`
                          : `Keine Profile für "${businessName}" gefunden`
                        }
                      </p>
                      {analysisData.found && analysisData.analysis && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {analysisData.analysis.overallScore}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Multi-Platform Sichtbarkeits-Score
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2">
                          🚨 Problembereiche
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {analysisData.analysis?.issues?.length > 0 ? (
                            analysisData.analysis.issues.map((issue: string, index: number) => (
                              <li key={index}>• {issue}</li>
                            ))
                          ) : (
                            <li>• Keine größeren Probleme gefunden</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">
                          🚀 Verbesserungschancen
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {analysisData.analysis?.opportunities?.length > 0 ? (
                            analysisData.analysis.opportunities.map((opportunity: string, index: number) => (
                              <li key={index}>• {opportunity}</li>
                            ))
                          ) : (
                            <li>• Profile bereits gut optimiert!</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Platform-specific details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Google Data */}
                      {analysisData.googleData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            🔍 Google Business Profil
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Bewertung:</span> {analysisData.googleData.rating || 'Keine'} ⭐
                            </div>
                            <div>
                              <span className="font-medium">Reviews:</span> {analysisData.googleData.reviewCount || 0}
                            </div>
                            <div>
                              <span className="font-medium">Website:</span> {analysisData.googleData.hasWebsite ? '✅' : '❌'}
                            </div>
                            <div>
                              <span className="font-medium">Öffnungszeiten:</span> {analysisData.googleData.hasOpeningHours ? '✅' : '❌'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Facebook Data */}
                      {analysisData.facebookData && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                            📘 Facebook Seite
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Fans:</span> {analysisData.facebookData.fanCount || 0} 👥
                            </div>
                            <div>
                              <span className="font-medium">Bewertung:</span> {analysisData.facebookData.rating || 'Keine'} ⭐
                            </div>
                            <div>
                              <span className="font-medium">Verifiziert:</span> {analysisData.facebookData.isVerified ? '✅' : '❌'}
                            </div>
                            <div>
                              <span className="font-medium">Aktuelle Posts:</span> {analysisData.facebookData.recentActivity ? '✅' : '❌'}
                            </div>
                          </div>
                          {analysisData.facebookData.facebookUrl && (
                            <a 
                              href={analysisData.facebookData.facebookUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Facebook Seite ansehen
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Missing platform alerts */}
                    {!analysisData.googleData && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                          ⚠️ Google Business Profil fehlt
                        </div>
                        <p className="text-sm text-yellow-700">
                          Ohne Google Profil verpassen Sie bis zu 80% der lokalen Suchanfragen.
                        </p>
                      </div>
                    )}

                    {!analysisData.facebookData && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-800 font-medium mb-2">
                          ℹ️ Facebook Seite nicht gefunden
                        </div>
                        <p className="text-sm text-purple-700">
                          Eine Facebook Business-Seite erweitert Ihre Reichweite erheblich.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {t('visibilityCheck.whatsappButton')}
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    onClick={() => setShowResult(false)}
                  >
                    {t('visibilityCheck.newCheckButton')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {t('visibilityCheck.disclaimer')} • Jetzt mit Facebook-Integration
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisibilityCheckSection;
