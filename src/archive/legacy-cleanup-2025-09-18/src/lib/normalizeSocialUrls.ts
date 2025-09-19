
/**
 * Normalisiert Facebook URLs und entfernt doppelte Präfixe
 */
export function normalizeFacebookUrl(input: string): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn bereits vollständiger Link vorhanden, bereinige doppelte Präfixe
  if (trimmed.startsWith('http')) {
    // Entferne doppelte facebook.com Präfixe
    const cleaned = trimmed.replace(/^https?:\/\/(www\.)?facebook\.com\/https?:\/\/(www\.)?facebook\.com\//, '');
    if (cleaned !== trimmed) {
      return `https://www.facebook.com/${cleaned}`;
    }
    return trimmed;
  }
  
  // Wenn nur Benutzername oder ID übergeben wurde
  return `https://www.facebook.com/${trimmed}`;
}

/**
 * Normalisiert Instagram URLs und entfernt doppelte Präfixe
 */
export function normalizeInstagramUrl(input: string): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn bereits vollständiger Link vorhanden
  if (trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // Entferne @ Symbol falls vorhanden
  const cleanedHandle = trimmed.replace(/^@/, '');
  
  return `https://www.instagram.com/${cleanedHandle}`;
}

/**
 * Extrahiert Handle aus Social Media URLs für die interne Verarbeitung
 */
export function extractSocialHandle(input: string, type: 'instagram' | 'facebook'): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn URL: Extrahiere Handle/Slug
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      
      if (type === 'instagram') {
        return parts[0] || ''; // z. B. "saxmuenchen"
      }
      
      if (type === 'facebook') {
        // Beispiel: https://www.facebook.com/p/SAX-Essen-Trinken-100086793825776/
        if (parts.includes('p') && parts.length > 1) {
          return parts[parts.indexOf('p') + 1] || '';
        }
        return parts[0] || ''; // Page-Name oder Slug
      }
    } catch (error) {
      console.warn('Invalid URL provided:', trimmed);
      return trimmed;
    }
  }
  
  // Entferne @ Symbol falls vorhanden
  return trimmed.replace(/^@/, '');
}
