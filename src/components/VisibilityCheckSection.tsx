
import React from 'react';
import { useTranslation } from 'react-i18next';
import VisibilityWizard from './visibility/VisibilityWizard';

const VisibilityCheckSection: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <section id="visibility-check" className="py-20 bg-primary/5 visibility-check-section">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('visibilityCheck.title', { defaultValue: 'Kostenloser Sichtbarkeits-Check' })}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('visibilityCheck.subtitle', { defaultValue: 'Erfahren Sie in wenigen Minuten, wie sichtbar Ihr Restaurant online ist und erhalten Sie konkrete Empfehlungen zur Verbesserung.' })}
          </p>
        </div>

        <VisibilityWizard />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {t('visibilityCheck.disclaimer', { defaultValue: '100% kostenlos • DSGVO-konform • Keine Verpflichtungen' })}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisibilityCheckSection;
