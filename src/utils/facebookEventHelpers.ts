
import { FacebookEventPayload, FacebookUserData, FacebookCustomData } from '@/types/facebook-events';

// SHA256 Hash Function für Client-Side (falls nötig)
export const hashSHA256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper zum Hashen von User Data
export const hashUserData = async (userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Promise<FacebookUserData> => {
  const hashedData: FacebookUserData = {};

  if (userData.email) {
    hashedData.em = [await hashSHA256(userData.email)];
  }

  if (userData.phone) {
    const cleanPhone = userData.phone.replace(/[^\d]/g, '');
    hashedData.ph = [await hashSHA256(cleanPhone)];
  }

  if (userData.firstName) {
    hashedData.fn = [await hashSHA256(userData.firstName)];
  }

  if (userData.lastName) {
    hashedData.ln = [await hashSHA256(userData.lastName)];
  }

  if (userData.city) {
    hashedData.ct = [await hashSHA256(userData.city)];
  }

  if (userData.state) {
    hashedData.st = [await hashSHA256(userData.state)];
  }

  if (userData.zip) {
    hashedData.zp = [await hashSHA256(userData.zip)];
  }

  if (userData.country) {
    hashedData.country = [await hashSHA256(userData.country)];
  }

  // Non-hashed data
  hashedData.client_user_agent = navigator.userAgent;

  // Try to get Facebook click ID and browser ID
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    hashedData.fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  // Check for fbp cookie
  const fbpCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('_fbp='));
  if (fbpCookie) {
    hashedData.fbp = fbpCookie.split('=')[1];
  }

  return hashedData;
};

// Event Builder Functions
export const buildViewContentEvent = (
  userData: FacebookUserData,
  customData?: { content_ids?: string[]; content_type?: string; content_name?: string }
): FacebookEventPayload => ({
  event_name: 'ViewContent',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: customData,
  event_id: crypto.randomUUID()
});

export const buildLeadEvent = (
  userData: FacebookUserData,
  customData?: { content_name?: string; value?: number }
): FacebookEventPayload => ({
  event_name: 'Lead',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: customData,
  event_id: crypto.randomUUID()
});

export const buildContactEvent = (
  userData: FacebookUserData,
  customData?: { content_name?: string }
): FacebookEventPayload => ({
  event_name: 'Contact',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: customData,
  event_id: crypto.randomUUID()
});

export const buildCompleteRegistrationEvent = (
  userData: FacebookUserData,
  customData?: { content_name?: string; status?: string }
): FacebookEventPayload => ({
  event_name: 'CompleteRegistration',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: customData,
  event_id: crypto.randomUUID()
});

export const buildSearchEvent = (
  userData: FacebookUserData,
  searchString: string,
  customData?: { content_category?: string }
): FacebookEventPayload => ({
  event_name: 'Search',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: {
    search_string: searchString,
    ...customData
  },
  event_id: crypto.randomUUID()
});

export const buildPurchaseEvent = (
  userData: FacebookUserData,
  value: number,
  currency: string = 'EUR',
  customData?: { content_ids?: string[]; num_items?: number }
): FacebookEventPayload => ({
  event_name: 'Purchase',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  event_source_url: window.location.href,
  user_data: userData,
  custom_data: {
    currency,
    value,
    ...customData
  },
  event_id: crypto.randomUUID()
});

// Helper für Event ID Generation
export const generateEventId = (): string => {
  return crypto.randomUUID();
};

// Helper für Deduplication
export const createDeduplicationKey = (eventName: string, userId?: string): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const baseKey = `${eventName}_${timestamp}`;
  return userId ? `${baseKey}_${userId}` : baseKey;
};
