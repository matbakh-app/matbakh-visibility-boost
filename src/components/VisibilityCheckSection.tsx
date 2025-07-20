import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Phone, ExternalLink } from 'lucide-react';

const VisibilityCheckSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleCheck = () => {
    if (businessName && location && email) {
      setShowResult(true);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hallo! Ich möchte eine kostenlose Sichtbarkeits-Analyse für mein Restaurant "${businessName}" in ${location}. Meine E-Mail: ${email}${website ? ', Website: ' + website : ''}. Können Sie mir dabei helfen?`
    );
    window.open(`https://wa.me/4915123456789?text=${message}`, '_blank');
  };

  return (
    <section className="py-20 bg-primary/5 visibility-check-section">{/* Added class for scroll targeting */}
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
                  disabled={!businessName || !location || !email}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t('visibilityCheck.checkButton')}
                </Button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {t('visibilityCheck.result.title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('visibilityCheck.result.description', { businessName, location })}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">
                      {t('visibilityCheck.result.issues.title')}
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• {t('visibilityCheck.result.issues.item1')}</li>
                      <li>• {t('visibilityCheck.result.issues.item2')}</li>
                      <li>• {t('visibilityCheck.result.issues.item3')}</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">
                      {t('visibilityCheck.result.potential.title')}
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {t('visibilityCheck.result.potential.item1')}</li>
                      <li>• {t('visibilityCheck.result.potential.item2')}</li>
                      <li>• {t('visibilityCheck.result.potential.item3')}</li>
                    </ul>
                  </div>
                </div>

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
            {t('visibilityCheck.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisibilityCheckSection;