
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getFooterNavItems } from './navigation/NavigationConfig';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation('footer');
  // WICHTIG: currentLang muss bei jedem Render neu evaluiert werden für Live-Übersetzung
  const currentLang = (i18n.language || 'de') as 'de' | 'en';
  // WICHTIG: footerLinks muss bei jedem Render neu geholt werden für Live-Übersetzung  
  const footerLinks = getFooterNavItems(currentLang);

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
                to={link.currentHref}
                className={`text-sm transition-colors ${
                  link.key === 'datenschutz' || link.key === 'privacy' 
                    ? 'text-black font-bold hover:text-gray-700' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {t(link.currentLabel)}
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
            {currentLang === 'de' 
              ? 'Rechtstexte: CTO-Governance • Letztes Audit: Januar 2025' 
              : 'Legal texts: CTO-Governance • Last audit: January 2025'
            }
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
