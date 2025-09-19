import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const VisibilityStepTwo: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  const handleNext = () => {
    // TODO: Implement dashboard navigation based on user type
    // For now, navigate to a placeholder dashboard
    navigate('/visibilitycheck/dashboard/results');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2"
        >
          ← Startseite
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          ← Zurück zu Step 1
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Social Media & Website</CardTitle>
          <p className="text-muted-foreground">Schritt 2/2</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Diese Seite wird in der nächsten Phase implementiert.
            </p>
            <p className="text-sm text-muted-foreground">
              Nach dem Double-Opt-In erhalten Sie hier Fragen zu Ihren Social Media Kanälen und Website-Details.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleBack}>
              Zurück
            </Button>
            <Button onClick={handleNext} className="bg-primary text-primary-foreground">
              Weiter zum Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisibilityStepTwo;