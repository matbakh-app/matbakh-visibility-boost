// ⚠️ Diese Datei steuert die zentrale Navigation. Änderungen nur mit Review.
// Central navigation configuration with multi-language support and safety checks

export interface NavigationItem {
  key: string;
  labels: {
    de: string;
    en: string;
  };
  hrefs: {
    de: string;
    en: string;
  };
  showInNav: boolean;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    key: 'home',
    labels: { de: 'Start', en: 'Home' },
    hrefs: { de: '/', en: '/' },
    showInNav: true
  },
  {
    key: 'services',
    labels: { de: 'Leistungen', en: 'Services' },
    hrefs: { de: '/services', en: '/services' },
    showInNav: true
  },
  {
    key: 'packages',
    labels: { de: 'Angebote', en: 'Packages' },
    hrefs: { de: '/angebote', en: '/packages' },
    showInNav: true
  },
  {
    key: 'b2c',
    labels: { de: 'Für Gäste', en: 'For Guests' },
    hrefs: { de: '/b2c', en: '/b2c-en' },
    showInNav: true
  },
  {
    key: 'contact',
    labels: { de: 'Kontakt', en: 'Contact' },
    hrefs: { de: '/kontakt', en: '/contact' },
    showInNav: true
  },
  {
    key: 'admin',
    labels: { de: 'Admin-Bereich', en: 'Admin Panel' },
    hrefs: { de: '/admin', en: '/admin' },
    showInNav: true,
    adminOnly: true
  }
];

// Get navigation link for specific language
export const getNavLink = (key: string, language: 'de' | 'en'): string => {
  const item = NAVIGATION_ITEMS.find(nav => nav.key === key);
  return item ? item.hrefs[language] : '/';
};

// Get navigation label for specific language
export const getNavLabel = (key: string, language: 'de' | 'en'): string => {
  const item = NAVIGATION_ITEMS.find(nav => nav.key === key);
  return item ? item.labels[language] : key;
};

// Enhanced validation for new navigation system
export const validateNavigationConfig = () => {
  if (process.env.NODE_ENV !== 'development') return true;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  NAVIGATION_ITEMS.forEach((item, index) => {
    // Check required fields
    if (!item.key) errors.push(`Navigation item ${index}: missing key`);
    if (!item.labels?.de || !item.labels?.en) {
      errors.push(`Navigation item ${item.key}: missing labels for de/en`);
    }
    if (!item.hrefs?.de || !item.hrefs?.en) {
      errors.push(`Navigation item ${item.key}: missing hrefs for de/en`);
    }
    if (item.showInNav === undefined) {
      warnings.push(`Navigation item ${item.key}: showInNav not explicitly set`);
    }
    
    // Check language consistency
    if (item.hrefs?.de && item.hrefs?.en) {
      if (item.hrefs.de === item.hrefs.en && item.key !== 'home' && item.key !== 'services' && item.key !== 'admin') {
        warnings.push(`Navigation item ${item.key}: same href for both languages, consider language-specific routes`);
      }
    }
  });
  
  // Log warnings
  warnings.forEach(warning => console.warn(`[Navigation Config] ${warning}`));
  
  // Log errors and throw if any
  if (errors.length > 0) {
    console.error('[Navigation Config] Validation errors:', errors);
    throw new Error(`Navigation validation failed: ${errors.join(', ')}`);
  }
  
  console.log('[Navigation Config] Validation passed ✓');
  return true;
};

// Get visible navigation items with language support
export const getVisibleNavItems = (isAdmin: boolean = false, language: 'de' | 'en' = 'de') => {
  return NAVIGATION_ITEMS.filter(item => {
    if (!item.showInNav) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  }).map(item => ({
    ...item,
    currentHref: item.hrefs[language],
    currentLabel: item.labels[language]
  }));
};

// Legacy support - will be deprecated
export const validateNavigation = validateNavigationConfig;