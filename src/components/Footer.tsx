
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation('footer');
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    const currentLang = i18n.language;
    let translatedPath = path;
    
    if (currentLang === 'en') {
      translatedPath = path
        .replace('/kontakt', '/contact')
        .replace('/impressum', '/imprint')
        .replace('/datenschutz', '/privacy')
        .replace('/agb', '/terms')
        .replace('/nutzung', '/usage');
    }
    
    navigate(translatedPath);
  };

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
            <button 
              onClick={() => handleNavigation('/impressum')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('imprint')}
            </button>
            <button 
              onClick={() => handleNavigation('/datenschutz')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('privacy')}
            </button>
            <button 
              onClick={() => handleNavigation('/agb')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('terms')}
            </button>
            <button 
              onClick={() => handleNavigation('/nutzung')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('usage')}
            </button>
            <button 
              onClick={() => handleNavigation('/kontakt')}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('contact')}
            </button>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-500">
            {t('email')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
