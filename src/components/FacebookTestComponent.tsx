
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFacebookConversions } from '@/hooks/useFacebookConversions';
import { FacebookEvents } from '@/utils/facebookPixel';

const FacebookTestComponent: React.FC = () => {
  const { 
    trackLead, 
    trackPurchase, 
    trackContact,
    pixelOnly,
    isPixelEnabled,
    isConsentGiven 
  } = useFacebookConversions();

  const facebookPixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
  const testPartnerId = 'test-partner-id';

  const handleTestLead = async () => {
    try {
      await trackLead(testPartnerId, { 
        value: 150, 
        content_name: 'Test Lead' 
      }, {
        email: 'test@example.com',
        first_name: 'Max',
        last_name: 'Mustermann'
      });
      console.log('✅ Test Lead Event gesendet');
    } catch (error) {
      console.error('❌ Test Lead Event fehlgeschlagen:', error);
    }
  };

  const handleTestPurchase = async () => {
    try {
      await trackPurchase(testPartnerId, { 
        value: 299, 
        content_ids: ['test-product-123'],
        num_items: 1
      }, {
        email: 'test@example.com'
      });
      console.log('✅ Test Purchase Event gesendet');
    } catch (error) {
      console.error('❌ Test Purchase Event fehlgeschlagen:', error);
    }
  };

  const handlePixelOnlyTest = () => {
    pixelOnly.viewContent('Facebook Test Page');
    console.log('✅ Frontend Pixel Event gesendet');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Facebook/Meta Tracking Test
          <Badge variant={isPixelEnabled ? 'default' : 'secondary'}>
            {isPixelEnabled ? 'Aktiviert' : 'Deaktiviert'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Pixel ID:</strong> {facebookPixelId || 'Nicht konfiguriert'}
          </div>
          <div>
            <strong>Consent:</strong> {isConsentGiven ? '✅ Erteilt' : '❌ Nicht erteilt'}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Dual Tracking Tests (Frontend + Backend API):</h4>
          <div className="flex gap-2">
            <Button onClick={handleTestLead} size="sm" disabled={!isConsentGiven}>
              Test Lead Event
            </Button>
            <Button onClick={handleTestPurchase} size="sm" disabled={!isConsentGiven}>
              Test Purchase Event
            </Button>
            <Button onClick={() => trackContact(testPartnerId)} size="sm" disabled={!isConsentGiven}>
              Test Contact Event
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Frontend Pixel Only Tests:</h4>
          <div className="flex gap-2">
            <Button onClick={handlePixelOnlyTest} size="sm" variant="outline" disabled={!isConsentGiven}>
              Test ViewContent
            </Button>
            <Button onClick={() => pixelOnly.search('test search')} size="sm" variant="outline" disabled={!isConsentGiven}>
              Test Search
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Öffne die Browser-Konsole für detaillierte Logs</p>
          <p>• Nutze die Facebook Pixel Helper Chrome Extension</p>
          <p>• Prüfe Events im Facebook Events Manager</p>
          {!isConsentGiven && (
            <p className="text-orange-600">⚠️ Bitte Cookie-Consent erteilen für Tests</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacebookTestComponent;
