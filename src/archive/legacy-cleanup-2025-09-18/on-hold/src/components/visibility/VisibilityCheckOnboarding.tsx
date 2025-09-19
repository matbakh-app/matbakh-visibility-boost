import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building, MapPin, Phone, Globe, FileText } from 'lucide-react';
import { useUserJourney } from '@/services/UserJourneyManager';

// Step 1: Geschäftsinformationen (matching the uploaded image)
const BusinessInfoStep: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('onboarding');
  const { getVCData, getOnboardingPrefillData } = useUserJourney();
  
  // Get prefill data from UserJourneyManager
  const vcData = getVCData();
  const prefillData = getOnboardingPrefillData();
  
  console.log('🔍 VC Data:', vcData);
  console.log('🔍 Prefill Data:', prefillData);
  
  // Form state with prefill data
  const [formData, setFormData] = useState({
    firmenname: vcData?.businessName || prefillData?.businessName || '',
    street: '',
    houseNumber: '',
    postalCode: vcData?.postalCode || '',
    city: vcData?.location || '',
    country: 'Deutschland',
    phone: '',
    website: vcData?.website || prefillData?.websiteUrl || '',
    description: '',
    categories: {
      essenTrinken: false,
      unterhaltungKultur: false,
      einzelhandelShopping: false
    }
  });

  const handleNext = () => {
    navigate('/visibilitycheck/onboarding/step2');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Schritt 1/2: Geschäftsinformationen</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div className="w-16 h-0.5 bg-muted"></div>
          <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
            2
          </div>
          <div className="w-16 h-0.5 bg-muted"></div>
          <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
            3
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Geschäftsinformationen eingeben</CardTitle>
          <p className="text-muted-foreground">
            Vervollständigen Sie Ihr Profil für den Sichtbarkeits-Check
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firmennameInput" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                {t('businessContact.contact.title')} *
              </Label>
              <Input 
                id="firmennameInput"
                placeholder="z. B. Restaurant München"
                value={formData.firmenname}
                onChange={(e) => setFormData(prev => ({...prev, firmenname: e.target.value}))}
              />
            </div>

            {/* Separate Address Fields */}
            <div className="space-y-4">
              {/* Street and House Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="streetInput" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t('businessContact.address.street')} *
                  </Label>
                  <Input 
                    id="streetInput"
                    placeholder={t('businessContact.address.streetPlaceholder')}
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({...prev, street: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="houseNumberInput">
                    {t('businessContact.address.houseNumber')} *
                  </Label>
                  <Input 
                    id="houseNumberInput"
                    placeholder={t('businessContact.address.houseNumberPlaceholder')}
                    value={formData.houseNumber}
                    onChange={(e) => setFormData(prev => ({...prev, houseNumber: e.target.value}))}
                  />
                </div>
              </div>

              {/* PLZ, City, Country */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCodeInput">
                    {t('businessContact.address.postalCode')} *
                  </Label>
                  <Input 
                    id="postalCodeInput"
                    placeholder={t('businessContact.address.postalCodePlaceholder')}
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({...prev, postalCode: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cityInput">
                    {t('businessContact.address.city')} *
                  </Label>
                  <Input 
                    id="cityInput"
                    placeholder={t('businessContact.address.cityPlaceholder')}
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countrySelect">
                    {t('businessContact.address.country')} *
                  </Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({...prev, country: value}))}>
                    <SelectTrigger id="countrySelect">
                      <SelectValue placeholder={t('businessContact.address.countryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Deutschland">Deutschland</SelectItem>
                      <SelectItem value="Österreich">Österreich</SelectItem>
                      <SelectItem value="Schweiz">Schweiz</SelectItem>
                      <SelectItem value="Andere">Andere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefonInput" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t('businessContact.contact.phone')} *
                </Label>
                <Input 
                  id="telefonInput"
                  placeholder="+49 89 123456"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteInput" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('businessContact.contact.website')} ({t('businessContact.optional')})
                </Label>
                <Input 
                  id="websiteInput"
                  placeholder="https://ihr-restaurant.de"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({...prev, website: e.target.value}))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibungInput" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('description')} ({t('businessContact.optional')})
              </Label>
              <Textarea 
                id="beschreibungInput"
                placeholder={t('descriptionPlaceholder')}
                className="min-h-20"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>
          </div>

          {/* Hauptkategorien wählen */}
          <div className="space-y-4">
            <h3 className="font-semibold">Hauptkategorien wählen</h3>
            <p className="text-sm text-muted-foreground">
              Wählen Sie bis zu (maxSelection:) Hauptkategorien aus.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Based on the uploaded image, showing relevant categories */}
              <div className="flex items-start space-x-2">
                <Checkbox id="essen-trinken" defaultChecked />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="essen-trinken" className="text-sm font-medium">
                    Essen & Trinken
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Restaurants, Cafés, Bars, Bäckereien, Lieferdienste
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="unterhaltung-kultur" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="unterhaltung-kultur" className="text-sm font-medium">
                    Unterhaltung & Kultur
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Kinos, Theater, Museen, Konzerthallen...
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="einzelhandel-shopping" />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="einzelhandel-shopping" className="text-sm font-medium">
                    Einzelhandel & Shopping
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Geschäfte, Boutiquen, Märkte, Online-Shops
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-orange-600">
              0 ausgewählt (Mindestens 5 empfohlen)
            </p>
          </div>

          {/* Next Steps Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Nächster Schritt</h4>
            <p className="text-sm text-blue-700">
              Nach dem Speichern führen wir einen Sichtbarkeits-Check durch
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleNext}
            className="w-full"
            size="lg"
          >
            Profil erstellen & Sichtbarkeits-Check starten
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Kostenlos und unverbindlich – Ihre Daten werden nicht gespeichert
          </p>

          <div className="text-center">
            <button className="text-sm text-primary hover:underline">
              Benötigen Sie Hilfe? Kontaktieren Sie uns
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 2: Social Media & Website (placeholder)
const SocialMediaStep: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Social Media & Website</CardTitle>
          <p className="text-muted-foreground">Schritt 2/2</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Diese Seite wird in der nächsten Phase implementiert.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/visibilitycheck/onboarding/step1')}>
              Zurück
            </Button>
            <Button onClick={() => navigate('/visibilitycheck/dashboard/results')}>
              Weiter zum Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export BusinessInfoStep as the main Step 1 component
const VisibilityCheckOnboarding: React.FC = () => {
  return <BusinessInfoStep />;
};

export default VisibilityCheckOnboarding;