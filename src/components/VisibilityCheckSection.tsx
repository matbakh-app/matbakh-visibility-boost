import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Phone, ExternalLink, Loader2, CheckCircle, AlertCircle, TrendingUp, Users, Star, Clock, Camera, MessageSquare, Heart, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TodoAction {
  todoType: string;
  todoText: string;
  todoWhy: string;
  isCritical: boolean;
  platform: 'google' | 'facebook' | 'instagram' | 'general';
}

interface EnhancedAnalysisData {
  found: boolean;
  businessName: string;
  location: string;
  leadId?: string;
  todos?: TodoAction[];
  analysis?: {
    overallScore: number;
    criticalIssues: string[];
    quickWins: string[];
    todoSummary: string;
    leadPotential: 'high' | 'medium' | 'low';
  };
  googleData?: {
    name: string;
    address: string;
    rating: number;
    reviewCount: number;
    hasWebsite: boolean;
    hasOpeningHours: boolean;
    hasPhotos: boolean;
    googleUrl: string;
    completenessScore: number;
    missingFeatures: string[];
  };
  facebookData?: {
    name: string;
    fanCount: number;
    rating: number;
    isVerified: boolean;
    hasAbout: boolean;
    hasLocation: boolean;
    facebookUrl: string;
    recentActivity: boolean;
    completenessScore: number;
    missingFeatures: string[];
  };
  instagramData?: {
    name: string;
    followers: number;
    isBusinessAccount: boolean;
    hasContactInfo: boolean;
    hasStoryHighlights: boolean;
    recentPosts: number;
    completenessScore: number;
    missingFeatures: string[];
  };
  error?: string;
}

const VisibilityCheckSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [requestReport, setRequestReport] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<EnhancedAnalysisData | null>(null);

  const handleCheck = async () => {
    if (businessName && location) {
      setIsLoading(true);
      try {
        console.log('🔍 Starte Sichtbarkeits-Check für:', businessName, location);
        
        const { data, error } = await supabase.functions.invoke('places-visibility-check', {
          body: {
            businessName,
            location,
            email: requestReport ? email : undefined,
            website: website || undefined,
            checkType: requestReport ? 'with_email' : 'anon'
          }
        });

        if (error) {
          console.error('❌ Fehler beim Sichtbarkeits-Check:', error);
          setAnalysisData({
            found: false,
            businessName,
            location,
            error: t('visibilityCheck.errors.analysisError', { defaultValue: 'Fehler bei der Analyse. Bitte versuchen Sie es später erneut.' })
          });
        } else {
          console.log('✅ Sichtbarkeits-Check erfolgreich:', data);
          setAnalysisData(data);
        }
        setShowResult(true);
      } catch (error) {
        console.error('❌ Netzwerk-Fehler:', error);
        setAnalysisData({
          found: false,
          businessName,
          location,
          error: t('visibilityCheck.errors.networkError', { defaultValue: 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.' })
        });
        setShowResult(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.warn('⚠️ Fehlende Pflichtfelder:', { businessName: !!businessName, location: !!location });
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      t('visibilityCheck.whatsappMessage', {
        businessName,
        location,
        score: analysisData?.analysis?.overallScore || '',
        defaultValue: `Hallo! Ich habe eine kostenlose Sichtbarkeits-Analyse für mein Restaurant "${businessName}" in ${location} durchgeführt. ${analysisData?.analysis ? `Mein Score: ${analysisData.analysis.overallScore}%. ` : ''}Können Sie mir bei der Optimierung helfen?`
      })
    );
    window.open(`https://wa.me/4915123456789?text=${message}`, '_blank');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return <Search className="h-4 w-4 text-blue-600" />;
      case 'facebook': return <Users className="h-4 w-4 text-blue-800" />;
      case 'instagram': return <Camera className="h-4 w-4 text-pink-600" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getLeadPotentialText = (potential: string) => {
    switch (potential) {
      case 'high':
        return t('visibilityCheck.potential.high', { defaultValue: '🚀 Hohes Potenzial' });
      case 'medium':
        return t('visibilityCheck.potential.medium', { defaultValue: '⚡ Mittleres Potenzial' });
      case 'low':
        return t('visibilityCheck.potential.low', { defaultValue: '✅ Gut optimiert' });
      default:
        return potential;
    }
  };

  return (
    <section id="visibility-check" className="py-20 bg-primary/5 visibility-check-section">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('visibilityCheck.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('visibilityCheck.subtitle')}
          </p>
        </div>

        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-black">
              {t('visibilityCheck.formTitle')}
            </CardTitle>
            <p className="text-gray-600">
              {t('visibilityCheck.formSubtitle')}
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

                  {/* Optional Report Request */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="request-report"
                        checked={requestReport}
                        onChange={(e) => setRequestReport(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="request-report" className="text-sm font-medium text-gray-700">
                        {t('visibilityCheck.reportRequest', { defaultValue: '📧 Detaillierten PDF-Bericht per E-Mail erhalten' })}
                      </label>
                    </div>
                    {requestReport && (
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
                          required={requestReport}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t('visibilityCheck.privacy', { defaultValue: 'DSGVO-konform • Keine Weitergabe • Jederzeit widerrufbar' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleCheck}
                  disabled={!businessName || !location || (requestReport && !email) || isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-5 w-5 mr-2" />
                  )}
                  {isLoading ? t('visibilityCheck.analyzing', { defaultValue: 'KI-Analyse läuft...' }) : t('visibilityCheck.checkButton')}
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
                      {t('visibilityCheck.errorTitle', { defaultValue: 'Fehler bei der Analyse' })}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {analysisData.error}
                    </p>
                  </div>
                )}

                {analysisData && !analysisData.error && (
                  <>
                    <div className="text-center">
                      <div className={`w-16 h-16 ${analysisData.found ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <BarChart3 className={`h-8 w-8 ${analysisData.found ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {analysisData.found 
                          ? t('visibilityCheck.analysisComplete', { defaultValue: 'Multi-Platform Analyse abgeschlossen!' })
                          : t('visibilityCheck.profilesNotFound', { defaultValue: 'Profile nicht gefunden' })
                        }
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {analysisData.found 
                          ? t('visibilityCheck.result.description', { businessName, location })
                          : t('visibilityCheck.noProfilesFound', { businessName, defaultValue: `Keine Profile für "${businessName}" gefunden` })
                        }
                      </p>
                      
                      {/* Overall Score */}
                      {analysisData.found && analysisData.analysis && (
                        <div className={`rounded-lg p-6 mb-6 border-2 ${getScoreBgColor(analysisData.analysis.overallScore)}`}>
                          <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysisData.analysis.overallScore)}`}>
                            {analysisData.analysis.overallScore}%
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {t('visibilityCheck.overallScore', { defaultValue: 'Gesamter Sichtbarkeits-Score' })}
                          </div>
                          <div className="flex items-center justify-center space-x-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-white ${
                              analysisData.analysis.leadPotential === 'high' ? 'bg-red-500' :
                              analysisData.analysis.leadPotential === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                              {getLeadPotentialText(analysisData.analysis.leadPotential)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Platform Scores */}
                    {analysisData.found && (
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        {/* Google Score */}
                        {analysisData.googleData && (
                          <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(analysisData.googleData.completenessScore)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <Search className="h-5 w-5 text-blue-600" />
                              <span className={`text-xl font-bold ${getScoreColor(analysisData.googleData.completenessScore)}`}>
                                {analysisData.googleData.completenessScore}%
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">Google Business</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>⭐ {analysisData.googleData.rating || t('visibilityCheck.none', { defaultValue: 'Keine' })} ({analysisData.googleData.reviewCount} {t('visibilityCheck.reviews', { defaultValue: 'Bewertungen' })})</div>
                              <div>{analysisData.googleData.hasWebsite ? '✅' : '❌'} Website</div>
                              <div>{analysisData.googleData.hasOpeningHours ? '✅' : '❌'} {t('visibilityCheck.openingHours', { defaultValue: 'Öffnungszeiten' })}</div>
                              <div>{analysisData.googleData.hasPhotos ? '✅' : '❌'} {t('visibilityCheck.photos', { defaultValue: 'Fotos' })}</div>
                            </div>
                          </div>
                        )}

                        {/* Facebook Score */}
                        {analysisData.facebookData && (
                          <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(analysisData.facebookData.completenessScore)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <Users className="h-5 w-5 text-blue-800" />
                              <span className={`text-xl font-bold ${getScoreColor(analysisData.facebookData.completenessScore)}`}>
                                {analysisData.facebookData.completenessScore}%
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">Facebook</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>👥 {analysisData.facebookData.fanCount} {t('visibilityCheck.fans', { defaultValue: 'Fans' })}</div>
                              <div>{analysisData.facebookData.isVerified ? '✅' : '❌'} {t('visibilityCheck.verified', { defaultValue: 'Verifiziert' })}</div>
                              <div>{analysisData.facebookData.hasAbout ? '✅' : '❌'} {t('visibilityCheck.description', { defaultValue: 'Beschreibung' })}</div>
                              <div>{analysisData.facebookData.recentActivity ? '✅' : '❌'} {t('visibilityCheck.recentPosts', { defaultValue: 'Aktuelle Posts' })}</div>
                            </div>
                          </div>
                        )}

                        {/* Instagram Score */}
                        {analysisData.instagramData && (
                          <div className={`rounded-lg p-4 border-2 ${getScoreBgColor(analysisData.instagramData.completenessScore)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <Camera className="h-5 w-5 text-pink-600" />
                              <span className={`text-xl font-bold ${getScoreColor(analysisData.instagramData.completenessScore)}`}>
                                {analysisData.instagramData.completenessScore}%
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">Instagram</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>👥 {analysisData.instagramData.followers} {t('visibilityCheck.followers', { defaultValue: 'Follower' })}</div>
                              <div>{analysisData.instagramData.isBusinessAccount ? '✅' : '❌'} {t('visibilityCheck.businessAccount', { defaultValue: 'Business Account' })}</div>
                              <div>{analysisData.instagramData.hasContactInfo ? '✅' : '❌'} {t('visibilityCheck.contactInfo', { defaultValue: 'Kontaktinfo' })}</div>
                              <div>{analysisData.instagramData.hasStoryHighlights ? '✅' : '❌'} {t('visibilityCheck.storyHighlights', { defaultValue: 'Story Highlights' })}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Critical Issues & Quick Wins */}
                    {analysisData.analysis && (
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {t('visibilityCheck.result.issues.title')}
                          </h4>
                          <ul className="text-sm text-red-700 space-y-2">
                            {analysisData.analysis.criticalIssues.length > 0 ? (
                              analysisData.analysis.criticalIssues.map((issue: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-red-500 mr-2">⚠️</span>
                                  {issue}
                                </li>
                              ))
                            ) : (
                              <li className="text-green-700">✅ {t('visibilityCheck.noCriticalIssues', { defaultValue: 'Keine kritischen Probleme gefunden' })}</li>
                            )}
                          </ul>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {t('visibilityCheck.result.potential.title')}
                          </h4>
                          <ul className="text-sm text-green-700 space-y-2">
                            {analysisData.analysis.quickWins.length > 0 ? (
                              analysisData.analysis.quickWins.map((win: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-green-500 mr-2">🚀</span>
                                  {win}
                                </li>
                              ))
                            ) : (
                              <li>🎯 {t('visibilityCheck.wellOptimized', { defaultValue: 'Profile bereits gut optimiert!' })}</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Top Todo Actions */}
                    {analysisData.todos && analysisData.todos.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('visibilityCheck.topRecommendations', { defaultValue: 'Top Empfehlungen' })}
                        </h4>
                        <div className="space-y-3">
                          {analysisData.todos.slice(0, 3).map((todo: TodoAction, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                              <div className="flex-shrink-0">
                                {getPlatformIcon(todo.platform)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-medium text-gray-900">{todo.todoText}</h5>
                                  {todo.isCritical && (
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                      {t('visibilityCheck.critical', { defaultValue: 'Kritisch' })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{todo.todoWhy}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {analysisData.analysis && (
                          <p className="text-sm text-blue-700 mt-3 text-center">
                            {analysisData.analysis.todoSummary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Missing platforms alerts */}
                    {!analysisData.googleData && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                          ⚠️ {t('visibilityCheck.missingGoogle', { defaultValue: 'Google Business Profil fehlt' })}
                        </div>
                        <p className="text-sm text-yellow-700">
                          {t('visibilityCheck.missingGoogleDescription', { defaultValue: 'Ohne Google Profil verpassen Sie bis zu 80% der lokalen Suchanfragen.' })}
                        </p>
                      </div>
                    )}

                    {!analysisData.facebookData && analysisData.googleData && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-800 font-medium mb-2">
                          ℹ️ {t('visibilityCheck.missingFacebook', { defaultValue: 'Facebook Seite nicht gefunden' })}
                        </div>
                        <p className="text-sm text-purple-700">
                          {t('visibilityCheck.missingFacebookDescription', { defaultValue: 'Eine Facebook Business-Seite erweitert Ihre Reichweite erheblich.' })}
                        </p>
                      </div>
                    )}

                    {/* Lead Success Message */}
                    {requestReport && email && analysisData.leadId && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                          📧 {t('visibilityCheck.reportSending', { defaultValue: 'PDF-Bericht wird versendet' })}
                        </div>
                        <p className="text-sm text-green-700">
                          {t('visibilityCheck.reportSendingDescription', { email, defaultValue: `Ihr detaillierter Sichtbarkeits-Bericht wird in Kürze an ${email} gesendet.` })}
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
                    onClick={() => {
                      setShowResult(false);
                      setAnalysisData(null);
                      setBusinessName('');
                      setLocation('');
                      setEmail('');
                      setWebsite('');
                      setRequestReport(false);
                    }}
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
            {t('visibilityCheck.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisibilityCheckSection;
