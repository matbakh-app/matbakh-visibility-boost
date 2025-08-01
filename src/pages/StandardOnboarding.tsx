// Phase 1: Standard-Onboarding für Email-Registrierung (wie aktueller Visibility Check)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building, MapPin, Phone, Globe, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function StandardOnboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation('onboarding');
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    categories: [] as string[],
    business_hours: {},
    services: [] as string[],
    target_audience: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name) {
      newErrors.company_name = t('validation.companyNameRequired', 'Firmenname ist erforderlich');
    }

    if (!formData.address) {
      newErrors.address = t('validation.addressRequired', 'Adresse ist erforderlich');
    }

    if (!formData.phone) {
      newErrors.phone = t('validation.phoneRequired', 'Telefonnummer ist erforderlich');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error(t('errors.notLoggedIn', 'Sie sind nicht angemeldet'));
      navigate('/register');
      return;
    }

    setLoading(true);

    try {
      // Phase 1: Erstmal lokal speichern, später mit ProfileService
      localStorage.setItem('onboarding_data', JSON.stringify({
        ...formData,
        user_id: user.id,
        registration_type: 'email',
        completed_at: new Date().toISOString()
      }));

      toast.success(t('success.profileSaved', 'Profil erfolgreich gespeichert!'));
      
      // Weiterleitung zum Visibility Check
      navigate('/visibility-check');

    } catch (error) {
      console.error('Standard onboarding error:', error);
      toast.error(t('errors.saveFailed', 'Fehler beim Speichern der Daten'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/register')}
            className="flex items-center space-x-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('navigation.back', 'Zurück')}</span>
          </Button>
          
          <div className="text-sm text-gray-500">
            {t('progress.step', 'Schritt')} 1/2: {t('progress.businessInfo', 'Unternehmensdaten')}
          </div>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('title.businessInfo', 'Unternehmensinformationen')}
            </CardTitle>
            <CardDescription>
              {t('subtitle.businessInfo', 'Teilen Sie uns die wichtigsten Informationen über Ihr Unternehmen mit')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name" className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{t('fields.companyName', 'Firmenname')} *</span>
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder={t('placeholders.companyName', 'Ihr Restaurantname')}
                  className={errors.company_name ? 'border-red-500' : ''}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-500">{errors.company_name}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{t('fields.address', 'Adresse')} *</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('placeholders.address', 'Straße, Hausnummer, PLZ, Stadt')}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Phone & Website Row */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{t('fields.phone', 'Telefon')} *</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('placeholders.phone', '+49 123 456789')}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>{t('fields.website', 'Website')} ({t('optional', 'optional')})</span>
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder={t('placeholders.website', 'https://ihr-restaurant.de')}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{t('fields.description', 'Beschreibung')} ({t('optional', 'optional')})</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('placeholders.description', 'Beschreiben Sie Ihr Restaurant, Ihre Küche und was Sie besonders macht...')}
                  rows={4}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('info.nextStep', 'Was passiert als nächstes?')}
                </h4>
                <p className="text-sm text-blue-700">
                  {t('info.nextStepDesc', 'Nach dem Speichern führen wir automatisch einen Visibility Check durch und zeigen Ihnen Verbesserungsmöglichkeiten für Ihre Online-Sichtbarkeit auf.')}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? 
                  t('buttons.saving', 'Speichere...') : 
                  t('buttons.continueToCheck', 'Weiter zum Visibility Check')
                }
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('help.needHelp', 'Benötigen Sie Hilfe?')}{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              {t('help.contactUs', 'Kontaktieren Sie uns')}
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}