
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation('footer');
  // WICHTIG: currentLang muss bei jedem Render neu evaluiert werden für Live-Übersetzung
  const currentLang = (i18n.language || 'de') as 'de' | 'en';

  // Direkte Footer-Links Definition mit korrekten Sprach-Routen
  const footerLinks = [
    {
      key: 'imprint',
      href: currentLang === 'de' ? '/impressum' : '/imprint',
      label: t('imprint')
    },
    {
      key: 'privacy',
      href: currentLang === 'de' ? '/datenschutz' : '/privacy',
      label: t('privacy'),
      isPrivacy: true // Markierung für SEO-Hervorhebung
    },
    {
      key: 'terms',
      href: currentLang === 'de' ? '/agb' : '/terms',
      label: t('terms')
    },
    {
      key: 'usage',
      href: currentLang === 'de' ? '/nutzung' : '/usage',
      label: t('usage')
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              {t('copyright')}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className={`text-sm transition-colors ${
                  link.isPrivacy 
                    ? 'text-black font-bold hover:text-gray-700' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={currentLang === 'de' ? '/kontakt' : '/contact'}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('contact')}
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-500">
            {t('email')}
          </p>
          <p className="text-xs text-gray-400">
            {t('auditInfo')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
