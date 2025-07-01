
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
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
              {t('footer.copyright')}
            </p>
          </div>
          
          <div className="flex space-x-6">
            <button 
              onClick={() => handleNavigation('/impressum')}
              className="text-sm text-gray-600 hover:text-black"
            >
              {t('footer.imprint')}
            </button>
            <button 
              onClick={() => handleNavigation('/datenschutz')}
              className="text-sm text-gray-600 hover:text-black"
            >
              {t('footer.privacy')}
            </button>
            <button 
              onClick={() => handleNavigation('/agb')}
              className="text-sm text-gray-600 hover:text-black"
            >
              {t('footer.terms')}
            </button>
            <button 
              onClick={() => handleNavigation('/nutzung')}
              className="text-sm text-gray-600 hover:text-black"
            >
              {t('footer.usage')}
            </button>
            <button 
              onClick={() => handleNavigation('/kontakt')}
              className="text-sm text-gray-600 hover:text-black"
            >
              {t('footer.contact')}
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {t('footer.email')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
