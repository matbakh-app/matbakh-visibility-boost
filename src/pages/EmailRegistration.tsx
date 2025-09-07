// Phase 1: Email-Registrierungsseite

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startAuth } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function EmailRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    acceptTerms: false,
    acceptMarketing: false
  });
  
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('form.firstNameRequired', 'Vorname ist erforderlich');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('form.lastNameRequired', 'Nachname ist erforderlich');
    }

    if (!formData.email) {
      newErrors.email = t('form.emailRequired', 'E-Mail ist erforderlich');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('form.emailInvalid', 'E-Mail-Format ist ungültig');
    }



    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('form.termsRequired', 'Sie müssen den Nutzungsbedingungen zustimmen');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use new AWS passwordless auth instead of Supabase
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      const result = await startAuth(formData.email, fullName);

      if (result.ok) {
        toast.success(t('messages.registrationSuccess', 'Registrierung erfolgreich!'), {
          description: t('messages.checkEmail', 'Prüfen Sie Ihre E-Mails für den Magic Link')
        });
        
        // Show success message and stay on page
        // User will receive magic link email and be redirected after clicking
        console.log('Magic link sent to:', formData.email);
      } else {
        toast.error(t('messages.registrationFailed', 'Registrierung fehlgeschlagen'), {
          description: result.error || 'Unbekannter Fehler'
        });
      }

    } catch (error) {
      console.error('Email registration error:', error);
      toast.error(t('messages.unexpectedError', 'Ein unerwarteter Fehler ist aufgetreten'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/register')}
          className="flex items-center space-x-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('navigation.back', 'Zurück')}</span>
        </Button>

        {/* Registration Form */}
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('form.emailRegistration', 'Mit E-Mail registrieren')}
            </CardTitle>
            <CardDescription>
              {t('form.emailRegistrationDesc', 'Wir senden Ihnen einen Magic Link zum Anmelden')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t('form.firstName', 'Vorname')} *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder={t('form.firstNamePlaceholder', 'Max')}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t('form.lastName', 'Nachname')} *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={t('form.lastNamePlaceholder', 'Mustermann')}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('form.email', 'E-Mail-Adresse')} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('form.emailPlaceholder', 'ihre@email.de')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Info about passwordless auth */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Passwordless Anmeldung
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Wir senden Ihnen einen sicheren Magic Link per E-Mail. Kein Passwort erforderlich!
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
                    className={errors.acceptTerms ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm leading-5">
                    {t('form.acceptTerms', 'Ich akzeptiere die')}{' '}
                    <a href="/legal/terms" target="_blank" className="text-blue-600 hover:underline">
                      {t('legal.terms', 'Nutzungsbedingungen')}
                    </a>{' '}
                    {t('form.and', 'und')}{' '}
                    <a href="/legal/privacy" target="_blank" className="text-blue-600 hover:underline">
                      {t('legal.privacy', 'Datenschutzerklärung')}
                    </a>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-500">{errors.acceptTerms}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptMarketing"
                    checked={formData.acceptMarketing}
                    onCheckedChange={(checked) => handleInputChange('acceptMarketing', !!checked)}
                  />
                  <Label htmlFor="acceptMarketing" className="text-sm leading-5">
                    {t('form.acceptMarketing', 'Ich möchte Marketing-E-Mails und Updates erhalten (optional)')}
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? 
                  t('form.sendingMagicLink', 'Magic Link wird gesendet...') : 
                  t('form.sendMagicLink', 'Magic Link senden')
                }
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Already have account */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('form.hasAccount', 'Bereits registriert?')}{' '}
            <button 
              onClick={() => navigate('/business/partner/login')}
              className="text-black font-medium hover:underline"
            >
              {t('form.signIn', 'Hier anmelden')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}