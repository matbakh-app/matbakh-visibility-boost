// src/components/navigation/NavigationConfig.ts

import { TFunction } from 'i18next';

type NavItem = {
  key: string;
  labelKey: string; // i18n Key, z. B. "nav.services"
  href: string;
  showInNav: boolean;
  showInFooter?: boolean;
  protected?: boolean;
  roles?: string[]; // z. B. ["admin", "partner"]
  hrefs?: { de: string; en: string }; // For backwards compatibility
};

export const NAVIGATION_ITEMS: NavItem[] = [
  { 
    key: "home", 
    labelKey: "nav.home", 
    href: "/", 
    showInNav: true,
    hrefs: { de: "/", en: "/" }
  },
  { 
    key: "services", 
    labelKey: "nav.services", 
    href: "/services", 
    showInNav: true,
    hrefs: { de: "/services", en: "/services" }
  },
  { 
    key: "angebote", 
    labelKey: "nav.angebote", 
    href: "/angebote", 
    showInNav: true,
    hrefs: { de: "/angebote", en: "/packages" }
  },
  { 
    key: "packages", 
    labelKey: "nav.packages", 
    href: "/packages", 
    showInNav: true,
    hrefs: { de: "/angebote", en: "/packages" }
  },
  { 
    key: "contact", 
    labelKey: "nav.contact", 
    href: "/contact", 
    showInNav: true,
    hrefs: { de: "/kontakt", en: "/contact" }
  },
  /* Footer-Links */
  { 
    key: "imprint", 
    labelKey: "nav.imprint", 
    href: "/impressum", 
    showInNav: false,
    showInFooter: true,
    hrefs: { de: "/impressum", en: "/imprint" }
  },
  { 
    key: "privacy", 
    labelKey: "nav.privacy", 
    href: "/datenschutz", 
    showInNav: false,
    showInFooter: true,
    hrefs: { de: "/datenschutz", en: "/privacy" }
  },
  { 
    key: "terms", 
    labelKey: "nav.terms", 
    href: "/agb", 
    showInNav: false,
    showInFooter: true,
    hrefs: { de: "/agb", en: "/terms" }
  },
  { 
    key: "usage", 
    labelKey: "nav.usage", 
    href: "/nutzung", 
    showInNav: false,
    showInFooter: true,
    hrefs: { de: "/nutzung", en: "/usage" }
  },
  /* Protected Routes */
  { 
    key: "dashboard", 
    labelKey: "nav.dashboard", 
    href: "/dashboard", 
    showInNav: false, 
    protected: true, 
    roles: ["admin", "partner"],
    hrefs: { de: "/dashboard", en: "/dashboard" }
  },
  { 
    key: "partnerDashboard", 
    labelKey: "nav.partnerDashboard", 
    href: "/partner/dashboard", 
    showInNav: false, 
    protected: true, 
    roles: ["partner"],
    hrefs: { de: "/partner/dashboard", en: "/partner/dashboard" }
  },
  { 
    key: "adminPanel", 
    labelKey: "nav.adminPanel", 
    href: "/admin", 
    showInNav: false, 
    protected: true, 
    roles: ["admin"],
    hrefs: { de: "/admin", en: "/admin" }
  }
];

// Helper function to get navigation link for specific language
export const getNavLink = (key: string, language: 'de' | 'en'): string => {
  const item = NAVIGATION_ITEMS.find(nav => nav.key === key);
  return item?.hrefs?.[language] || item?.href || '/';
};

// Helper function to get visible navigation items
export const getVisibleNavItems = (isAdmin: boolean = false, language: 'de' | 'en' = 'de') => {
  return NAVIGATION_ITEMS
    .filter(item => {
      if (!item.showInNav) return false;
      if (item.protected && item.roles) {
        return item.roles.includes('admin') && isAdmin;
      }
      return true;
    })
    .map(item => ({
      ...item,
      currentHref: item.hrefs?.[language] || item.href,
      currentLabel: item.labelKey // This will be translated by the component
    }));
};

// Helper function to get footer navigation items
export const getFooterNavItems = (language: 'de' | 'en' = 'de') => {
  return NAVIGATION_ITEMS
    .filter(item => item.showInFooter)
    .map(item => ({
      ...item,
      currentHref: item.hrefs?.[language] || item.href,
      currentLabel: item.labelKey
    }));
};

// Validation function for development
export const validateNavigationConfig = (): boolean => {
  if (process.env.NODE_ENV !== 'development') return true;
  
  const issues: string[] = [];
  
  NAVIGATION_ITEMS.forEach(item => {
    if (!item.key) issues.push(`Missing key for item: ${JSON.stringify(item)}`);
    if (!item.labelKey) issues.push(`Missing labelKey for item: ${item.key}`);
    if (!item.href && !item.hrefs) issues.push(`Missing href/hrefs for item: ${item.key}`);
    
    if (item.hrefs) {
      if (!item.hrefs.de) issues.push(`Missing German href for item: ${item.key}`);
      if (!item.hrefs.en) issues.push(`Missing English href for item: ${item.key}`);
    }
  });
  
  if (issues.length > 0) {
    console.warn('NavigationConfig validation issues:', issues);
    return false;
  }
  
  return true;
};