// Phase 1: Haupt-Registrierungs-Auswahlseite

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Chrome, Facebook } from 'lucide-react';

export default function RegistrationOptions() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const registrationOptions = [
    {
      id: 'email',
      title: t('form.emailRegistration', 'Mit E-Mail registrieren'),
      description: t('form.emailDescription', 'Klassische Registrierung mit E-Mail und Passwort'),
      icon: Mail,
      route: '/register/email',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'google',
      title: t('form.googleRegistration', 'Mit Google registrieren'),
      description: t('form.googleDescription', 'Schnelle Anmeldung mit automatischer GMB-Integration'),
      icon: Chrome,
      route: '/auth/google',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      id: 'facebook',
      title: t('form.facebookRegistration', 'Mit Facebook registrieren'),
      description: t('form.facebookDescription', 'Integriert Facebook und Instagram Unternehmensprofile'),
      icon: Facebook,
      route: '/register/facebook',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    }
  ];

  const handleRegistrationChoice = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-black">
            {t('registration.title', 'Jetzt registrieren')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('registration.subtitle', 'Wählen Sie Ihre bevorzugte Registrierungsmethode und starten Sie mit der Optimierung Ihrer Online-Sichtbarkeit')}
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {registrationOptions.map((option) => {
            const IconComponent = option.icon;
            
            return (
              <Card 
                key={option.id}
                className="hover:shadow-lg transition-shadow duration-200 border-2 cursor-pointer"
                onClick={() => handleRegistrationChoice(option.route)}
              >
                <CardHeader className="text-center space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${option.color}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {option.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <CardDescription className="text-gray-600">
                    {option.description}
                  </CardDescription>
                  <Button 
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegistrationChoice(option.route);
                    }}
                  >
                    {t('registration.choose', 'Auswählen')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {t('registration.infoTitle', 'Was passiert nach der Registrierung?')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>{t('registration.step1', 'Schritt 1:')}</strong>
              <br />
              {t('registration.step1Desc', 'Onboarding-Formular ausfüllen')}
            </div>
            <div>
              <strong>{t('registration.step2', 'Schritt 2:')}</strong>
              <br />
              {t('registration.step2Desc', 'Automatischer Visibility Check')}
            </div>
            <div>
              <strong>{t('registration.step3', 'Schritt 3:')}</strong>
              <br />
              {t('registration.step3Desc', 'Dashboard mit Ergebnissen')}
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <p className="text-gray-600">
            {t('registration.hasAccount', 'Bereits registriert?')}
            {' '}
            <button 
              onClick={() => navigate('/business/partner/login')}
              className="text-black font-medium hover:underline"
            >
              {t('registration.backToLogin', 'Hier anmelden')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}