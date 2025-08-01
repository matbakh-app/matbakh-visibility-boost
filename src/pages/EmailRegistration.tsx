// Phase 1: Email-Registrierungsseite

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';

export default function EmailRegistration() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('form.emailRequired', 'E-Mail ist erforderlich');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('form.emailInvalid', 'E-Mail-Format ist ungültig');
    }

    if (!formData.password) {
      newErrors.password = t('form.passwordRequired', 'Passwort ist erforderlich');
    } else if (formData.password.length < 8) {
      newErrors.password = t('form.passwordTooShort', 'Passwort muss mindestens 8 Zeichen haben');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('form.passwordMismatch', 'Passwörter stimmen nicht überein');
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding/standard`,
          data: {
            registration_type: 'email',
            accept_marketing: formData.acceptMarketing
          }
        }
      });

      if (error) {
        toast.error(t('messages.registrationFailed', 'Registrierung fehlgeschlagen'), {
          description: error.message
        });
        return;
      }

      if (data.user) {
        toast.success(t('messages.registrationSuccess', 'Registrierung erfolgreich!'), {
          description: t('messages.checkEmail', 'Prüfen Sie Ihre E-Mails für die Bestätigung')
        });
        
        // Redirect zum Standard-Onboarding
        navigate('/onboarding/standard');
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
              {t('form.emailRegistrationDesc', 'Erstellen Sie Ihr Konto mit E-Mail und Passwort')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('form.password', 'Passwort')} *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={t('form.passwordPlaceholder', 'Mindestens 8 Zeichen')}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('form.confirmPassword', 'Passwort bestätigen')} *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder={t('form.confirmPasswordPlaceholder', 'Passwort wiederholen')}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
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
                  t('form.registering', 'Registriere...') : 
                  t('form.register', 'Registrieren')
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