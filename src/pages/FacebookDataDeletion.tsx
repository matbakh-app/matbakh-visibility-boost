import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Clock, Shield, Trash2 } from 'lucide-react';

const FacebookDataDeletion = () => {
  const { t, i18n } = useTranslation('facebook-data-deletion');
  const currentLang = i18n.language;

  const steps = [
    { key: 'step1', icon: '1' },
    { key: 'step2', icon: '2' },
    { key: 'step3', icon: '3' },
    { key: 'step4', icon: '4' },
    { key: 'step5', icon: '5' },
    { key: 'step6', icon: '6' }
  ];

  const deletedData = t('deletedData', { returnObjects: true }) as string[];

  return (
    <>
      <Helmet>
        <title>{t('title')} - matbakh.app</title>
        <meta name="description" content={t('intro')} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://matbakh.app/facebook-data-deletion${currentLang === 'en' ? '?lang=en' : ''}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {t('subtitle')}
            </p>
            <Badge variant="outline" className="mb-4">
              <Shield className="w-4 h-4 mr-2" />
              DSGVO / GDPR Compliant
            </Badge>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                {t('intro')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('compliance')}
              </p>
            </CardContent>
          </Card>

          {/* Deletion Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                {t('stepsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {t(`${step.key}.title`)}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {t(`${step.key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Contact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                {t('alternativeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('alternativeText')}
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">{t('email')}</p>
                <p className="text-sm text-muted-foreground">{t('subject')}</p>
              </div>
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                {t('responseTime')}
              </div>
            </CardContent>
          </Card>

          {/* What will be deleted */}
          <Card>
            <CardHeader>
              <CardTitle>{t('deletedDataTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {deletedData.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Separator className="my-4" />
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong className="font-medium">
                    {t('note')}
                  </strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              matbakh.app – Visibility for Hospitality
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacebookDataDeletion;