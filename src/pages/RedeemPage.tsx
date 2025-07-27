import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RedeemCodeInput } from '@/components/redeem/RedeemCodeInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';

const RedeemPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefilledCode = searchParams.get('code');
  const leadId = searchParams.get('leadId');
  const [isRedeemed, setIsRedeemed] = useState(false);

  useEffect(() => {
    // Auto-fill code if provided in URL
    if (prefilledCode) {
      console.log('Pre-filled code from URL:', prefilledCode);
    }
  }, [prefilledCode]);

  const handleCodeRedeemed = () => {
    setIsRedeemed(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Redeem-Code einlösen</h1>
            <p className="text-lg text-muted-foreground">
              Lösen Sie Ihren Code ein, um vollständigen Zugang zu Ihrem Sichtbarkeits-Report zu erhalten
            </p>
          </div>

          {!isRedeemed ? (
            <div className="space-y-6">
              {prefilledCode && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Code erkannt</Badge>
                      <span className="font-mono text-lg">{prefilledCode}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Klicken Sie unten auf "Code einlösen" um fortzufahren.
                    </p>
                  </CardContent>
                </Card>
              )}

              {leadId ? (
                <RedeemCodeInput 
                  leadId={leadId}
                  onCodeRedeemed={handleCodeRedeemed}
                />
              ) : (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800">Lead-ID erforderlich</CardTitle>
                    <CardDescription>
                      Um einen Code einzulösen, benötigen wir eine gültige Lead-ID. 
                      Bitte stellen Sie sicher, dass Sie den Link aus Ihrem Sichtbarkeits-Report verwenden.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">✅ Code erfolgreich eingelöst!</CardTitle>
                <CardDescription>
                  Ihr Sichtbarkeits-Report wurde freigeschaltet. Sie können nun alle Premium-Features nutzen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Was Sie jetzt tun können:</strong>
                  </p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>Vollständigen Sichtbarkeits-Report herunterladen</li>
                    <li>Detaillierte Konkurrenzanalyse einsehen</li>
                    <li>Personalisierte Empfehlungen erhalten</li>
                    <li>Kontakt zu unserem Expert-Team aufnehmen</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Haben Sie Fragen?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bei Problemen mit der Code-Einlösung kontaktieren Sie uns unter{' '}
                  <a href="mailto:support@matbakh.app" className="text-primary hover:underline">
                    support@matbakh.app
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RedeemPage;