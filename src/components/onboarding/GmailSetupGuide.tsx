
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, ExternalLink, Mail, CheckCircle } from 'lucide-react';

interface GmailSetupGuideProps {
  onComplete: () => void;
  onBack: () => void;
}

export const GmailSetupGuide: React.FC<GmailSetupGuideProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [gmailAddress, setGmailAddress] = useState('');

  const steps = [
    {
      title: 'Gmail-Konto erstellen',
      description: 'Wir helfen Ihnen dabei, ein neues Gmail-Konto zu erstellen',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Schritt 1: Gmail-Registrierung</h4>
            <p className="text-blue-700 text-sm mb-4">
              Klicken Sie auf den Button unten, um die Gmail-Registrierung zu öffnen. 
              Lassen Sie dieses Fenster geöffnet und kehren Sie hierher zurück, wenn Sie fertig sind.
            </p>
            <Button 
              onClick={() => window.open('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp', '_blank')}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Gmail-Konto erstellen
            </Button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Wichtige Hinweise:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Wählen Sie einen professionellen Benutzernamen</li>
              <li>• Verwenden Sie ein sicheres Passwort</li>
              <li>• Notieren Sie sich Ihre Anmeldedaten</li>
              <li>• Bestätigen Sie Ihre Telefonnummer</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Gmail-Adresse eingeben',
      description: 'Geben Sie Ihre neue Gmail-Adresse ein',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Gmail-Konto erstellt!</h4>
            </div>
            <p className="text-green-700 text-sm">
              Großartig! Geben Sie nun Ihre neue Gmail-Adresse ein, damit wir sie für Ihr Google Business Profil verwenden können.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gmail-address" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Ihre neue Gmail-Adresse
            </Label>
            <Input
              id="gmail-address"
              type="email"
              placeholder="ihre.email@gmail.com"
              value={gmailAddress}
              onChange={(e) => setGmailAddress(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Tipp:</strong> Stellen Sie sicher, dass Sie sich mit dieser E-Mail-Adresse bei Gmail anmelden können, 
              bevor Sie fortfahren.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const canProceed = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return gmailAddress && gmailAddress.includes('@gmail.com');
    return false;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save Gmail address and proceed
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Mail className="w-4 h-4" />
            Gmail-Setup • Schritt {currentStep} von {steps.length}
          </div>
          <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
          <p className="text-gray-600">{currentStepData.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData.content}
          
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length ? 'Fertig' : 'Weiter'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
