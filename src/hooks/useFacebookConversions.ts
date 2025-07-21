
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FacebookEventPayload, FacebookEventType } from '@/types/facebook-events';
import { useLeadTracking } from './useLeadTracking';
import { trackFacebookEvent, FacebookEvents } from '@/utils/facebookPixel';

interface FacebookEventData {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
}

interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID from URL
  fbp?: string; // Facebook browser ID from cookie
}

interface CustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  status?: string;
  [key: string]: any;
}

export const useFacebookConversions = () => {
  const { createLeadEvent, createLeadSource } = useLeadTracking();
  
  // Environment-Variablen für Facebook-Integration
  const facebookPixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
  const isDebugMode = import.meta.env.DEV;

  const sendEvent = useCallback(async (
    partnerId: string,
    eventData: FacebookEventData,
    userData?: UserData,
    customData?: CustomData,
    testEventCode?: string
  ) => {
    try {
      // Check if consent is given
      const consent = localStorage.getItem('cookieConsent');
      if (consent !== 'accepted') {
        console.log('Facebook Tracking: Consent nicht erteilt - Event wird nicht gesendet');
        return;
      }

      // Add current page URL if not provided
      if (!eventData.event_source_url) {
        eventData.event_source_url = window.location.href;
      }

      // Add client user agent if not provided
      if (userData && !userData.client_user_agent) {
        userData.client_user_agent = navigator.userAgent;
      }

      // Try to get Facebook click ID and browser ID from cookies/URL
      if (userData) {
        // Check for fbc parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const fbclid = urlParams.get('fbclid');
        if (fbclid && !userData.fbc) {
          userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
        }

        // Check for fbp cookie (Facebook browser ID)
        if (!userData.fbp) {
          const fbpCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('_fbp='));
          if (fbpCookie) {
            userData.fbp = fbpCookie.split('=')[1];
          }
        }
      }

      // DUAL TRACKING: Frontend Pixel + Backend Conversions API
      
      // 1. Frontend Pixel Event (für sofortiges Tracking)
      if (facebookPixelId && typeof window !== 'undefined') {
        trackFacebookEvent(eventData.event_name, customData);
      }

      // 2. Backend Conversions API (für Server-to-Server Tracking)
      const { data, error } = await supabase.functions.invoke('facebook-conversions', {
        body: {
          partner_id: partnerId,
          event_data: eventData,
          user_data: userData,
          custom_data: customData,
          test_event_code: testEventCode
        }
      });

      if (error) {
        console.error('Facebook Conversions API Error:', error);
        throw error;
      }

      // Track lead event in our database
      if (data?.success && data?.event_id) {
        await createLeadEvent({
          email: userData?.email,
          event_type: eventData.event_name,
          event_payload: {
            event_data: eventData,
            user_data: userData,
            custom_data: customData,
            tracking_method: 'dual_pixel_and_api'
          },
          partner_id: partnerId,
          facebook_event_id: data.event_id,
          response_status: 200,
          success: true
        });

        // Track lead source if UTM parameters are available
        const urlParams = new URLSearchParams(window.location.search);
        const utm_source = urlParams.get('utm_source');
        const utm_medium = urlParams.get('utm_medium');
        const utm_campaign = urlParams.get('utm_campaign');

        if (utm_source || utm_medium || utm_campaign) {
          await createLeadSource({
            lead_id: data.lead_id,
            source_system: 'meta',
            source_url: window.location.href,
            utm_source: utm_source || undefined,
            utm_medium: utm_medium || undefined,
            utm_campaign: utm_campaign || undefined
          });
        }
      }

      if (isDebugMode) {
        console.log('✅ Facebook Dual Tracking erfolgreich:', {
          frontend_pixel: !!facebookPixelId,
          backend_api: !!data?.success,
          event_name: eventData.event_name
        });
      }

      return data;
    } catch (error) {
      console.error('Failed to send Facebook conversion event:', error);
      
      // Still track failed events for debugging
      await createLeadEvent({
        email: userData?.email,
        event_type: eventData.event_name,
        event_payload: {
          event_data: eventData,
          user_data: userData,
          custom_data: customData,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        partner_id: partnerId,
        success: false
      });
      
      throw error;
    }
  }, [createLeadEvent, createLeadSource, facebookPixelId, isDebugMode]);

  // Enhanced event helpers with dual tracking
  const trackPageView = useCallback((partnerId: string, userData?: UserData) => {
    return sendEvent(partnerId, { event_name: 'ViewContent' }, userData);
  }, [sendEvent]);

  const trackViewContent = useCallback((
    partnerId: string, 
    contentData: { content_ids?: string[], content_type?: string, content_name?: string, value?: number },
    userData?: UserData
  ) => {
    return sendEvent(
      partnerId, 
      { event_name: 'ViewContent' }, 
      userData,
      { 
        currency: 'EUR',
        ...contentData
      }
    );
  }, [sendEvent]);

  const trackLead = useCallback((
    partnerId: string,
    leadData: { value?: number, content_name?: string },
    userData?: UserData
  ) => {
    return sendEvent(
      partnerId,
      { event_name: 'Lead' },
      userData,
      {
        currency: 'EUR',
        ...leadData
      }
    );
  }, [sendEvent]);

  const trackPurchase = useCallback((
    partnerId: string,
    purchaseData: { value: number, content_ids?: string[], num_items?: number },
    userData?: UserData
  ) => {
    return sendEvent(
      partnerId,
      { event_name: 'Purchase' },
      userData,
      {
        currency: 'EUR',
        ...purchaseData
      }
    );
  }, [sendEvent]);

  const trackContact = useCallback((
    partnerId: string,
    userData?: UserData
  ) => {
    return sendEvent(partnerId, { event_name: 'Contact' }, userData);
  }, [sendEvent]);

  const trackCompleteRegistration = useCallback((
    partnerId: string,
    registrationData: { content_name?: string, status?: string },
    userData?: UserData
  ) => {
    return sendEvent(
      partnerId,
      { event_name: 'CompleteRegistration' },
      userData,
      registrationData
    );
  }, [sendEvent]);

  const trackSearch = useCallback((
    partnerId: string,
    searchData: { search_string: string, content_category?: string },
    userData?: UserData
  ) => {
    return sendEvent(
      partnerId,
      { event_name: 'Search' },
      userData,
      searchData
    );
  }, [sendEvent]);

  // Direct Frontend Pixel Helpers (ohne Backend API)
  const pixelOnly = {
    lead: (leadData?: any) => FacebookEvents.lead(leadData),
    purchase: (value: number, currency?: string) => FacebookEvents.purchase(value, currency),
    contact: () => FacebookEvents.contact(),
    registration: (method?: string) => FacebookEvents.registration(method),
    search: (searchTerm: string) => FacebookEvents.search(searchTerm),
    viewContent: (contentName?: string) => FacebookEvents.viewContent(contentName)
  };

  return {
    // Dual Tracking (Frontend + Backend)
    sendEvent,
    trackPageView,
    trackViewContent,
    trackLead,
    trackPurchase,
    trackContact,
    trackCompleteRegistration,
    trackSearch,
    
    // Frontend Pixel Only
    pixelOnly,
    
    // Status
    isPixelEnabled: !!facebookPixelId,
    isConsentGiven: localStorage.getItem('cookieConsent') === 'accepted'
  };
};
