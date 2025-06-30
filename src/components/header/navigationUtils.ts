
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

export const useNavigationUtils = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    const currentLang = i18n.language;
    let translatedPath = path;
    
    if (currentLang === 'en') {
      translatedPath = path
        .replace('/kontakt', '/contact')
        .replace('/impressum', '/imprint')
        .replace('/datenschutz', '/privacy')
        .replace('/agb', '/terms')
        .replace('/b2c', '/b2c-en')
        .replace('/angebote', '/packages');
    }
    
    console.log('Navigating to:', translatedPath);
    navigate(translatedPath);
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    if (path === '/' && currentPath === '/') return true;
    if (path === '/b2c' && (currentPath === '/b2c' || currentPath === '/b2c-en')) return true;
    if (path === '/kontakt' && (currentPath === '/kontakt' || currentPath === '/contact')) return true;
    if (path === '/angebote' && (currentPath === '/angebote' || currentPath === '/packages')) return true;
    return currentPath === path;
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    
    // Handle route translation
    const currentPath = location.pathname;
    let newPath = currentPath;
    
    if (newLang === 'en') {
      newPath = currentPath
        .replace('/kontakt', '/contact')
        .replace('/impressum', '/imprint')
        .replace('/datenschutz', '/privacy')
        .replace('/agb', '/terms')
        .replace('/b2c', '/b2c-en')
        .replace('/services', '/services')
        .replace('/angebote', '/packages');
    } else {
      newPath = currentPath
        .replace('/contact', '/kontakt')
        .replace('/imprint', '/impressum')
        .replace('/privacy', '/datenschutz')
        .replace('/terms', '/agb')
        .replace('/b2c-en', '/b2c')
        .replace('/packages', '/angebote');
    }
    
    if (newPath !== currentPath) {
      navigate(newPath);
    }
  };

  return {
    handleNavigation,
    isActive,
    toggleLanguage
  };
};
