
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNavLink, NAVIGATION_ITEMS } from '../navigation/NavigationConfig';

export const useNavigationUtils = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get navigation link using central config
  const getNavigationLink = (key: string, language?: 'de' | 'en'): string => {
    const lang = language || (i18n.language as 'de' | 'en');
    return getNavLink(key, lang);
  };

  // Legacy function - now uses central config
  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  // Enhanced isActive function with language awareness
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    if (path === '/' && currentPath === '/') return true;
    
    // Check for language-specific matches
    const currentLang = i18n.language as 'de' | 'en';
    
    // Find navigation item that matches current path
    const navItem = NAVIGATION_ITEMS.find(item => 
      item.hrefs.de === currentPath || item.hrefs.en === currentPath
    );
    
    if (navItem) {
      // Check if the provided path matches either language version of this nav item
      return navItem.hrefs.de === path || navItem.hrefs.en === path;
    }
    
    return currentPath === path;
  };

  // Enhanced language toggle with proper route mapping
  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    const currentLang = i18n.language as 'de' | 'en';
    i18n.changeLanguage(newLang);
    
    const currentPath = location.pathname;
    
    // Find which navigation item corresponds to current path
    const currentNavItem = NAVIGATION_ITEMS.find(item => 
      item.hrefs[currentLang] === currentPath
    );
    
    if (currentNavItem) {
      // Navigate to the same page in new language
      const newPath = currentNavItem.hrefs[newLang as 'de' | 'en'];
      if (newPath !== currentPath) {
        navigate(newPath);
      }
    } else {
      // Fallback: Manual path translation for non-navigation pages
      let newPath = currentPath;
      
      if (newLang === 'en') {
        newPath = currentPath
          .replace('/kontakt', '/contact')
          .replace('/impressum', '/imprint')
          .replace('/datenschutz', '/privacy')
          .replace('/agb', '/terms')
          .replace('/nutzung', '/usage')
          .replace('/b2c', '/b2c-en')
          .replace('/angebote', '/packages');
      } else {
        newPath = currentPath
          .replace('/contact', '/kontakt')
          .replace('/imprint', '/impressum')
          .replace('/privacy', '/datenschutz')
          .replace('/terms', '/agb')
          .replace('/usage', '/nutzung')
          .replace('/b2c-en', '/b2c')
          .replace('/packages', '/angebote');
      }
      
      if (newPath !== currentPath) {
        navigate(newPath);
      }
    }
  };

  return {
    handleNavigation,
    isActive,
    toggleLanguage,
    getNavigationLink
  };
};
