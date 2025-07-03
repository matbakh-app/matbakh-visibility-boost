// Navigation configuration with safety checks
export interface NavigationItem {
  key: string;
  href: string;
  translationKey: string;
  showInNav?: boolean;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    key: 'home',
    href: '/',
    translationKey: 'home',
    showInNav: true
  },
  {
    key: 'services',
    href: '/services',
    translationKey: 'services',
    showInNav: true
  },
  {
    key: 'packages',
    href: '/angebote',
    translationKey: 'packages',
    showInNav: true
  },
  {
    key: 'b2c',
    href: '/b2c',
    translationKey: 'b2c',
    showInNav: true
  },
  {
    key: 'contact',
    href: '/kontakt',
    translationKey: 'contact',
    showInNav: true
  },
  {
    key: 'admin',
    href: '/admin',
    translationKey: 'adminPanel',
    showInNav: true,
    adminOnly: true
  }
];

// Safety check: Ensure all navigation items have required properties
export const validateNavigation = () => {
  const errors: string[] = [];
  
  NAVIGATION_ITEMS.forEach((item, index) => {
    if (!item.key) errors.push(`Navigation item ${index}: missing key`);
    if (!item.href) errors.push(`Navigation item ${index}: missing href`);
    if (!item.translationKey) errors.push(`Navigation item ${index}: missing translationKey`);
    if (item.showInNav === undefined) {
      console.warn(`Navigation item ${item.key}: showInNav not explicitly set, defaulting to true`);
    }
  });
  
  if (errors.length > 0) {
    console.error('Navigation configuration errors:', errors);
    throw new Error(`Navigation validation failed: ${errors.join(', ')}`);
  }
  
  return true;
};

// Get visible navigation items
export const getVisibleNavItems = (isAdmin: boolean = false) => {
  return NAVIGATION_ITEMS.filter(item => {
    if (item.showInNav === false) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });
};