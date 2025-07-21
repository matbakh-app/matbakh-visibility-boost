
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FacebookEventPayload, FacebookEventType } from '@/types/facebook-events';
import { useLeadTracking } from './useLeadTracking';

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

  const sendEvent = useCallback(async (
    partnerId: string,
    eventData: FacebookEventData,
    userData?: UserData,
    customData?: CustomData,
    testEventCode?: string
  ) => {
    try {
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
        console.error('Facebook Conversions Error:', error);
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
            custom_data: customData
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
            lead_id: data.lead_id, // Assuming the API returns this
            source_system: 'meta',
            source_url: window.location.href,
            utm_source: utm_source || undefined,
            utm_medium: utm_medium || undefined,
            utm_campaign: utm_campaign || undefined
          });
        }
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
  }, [createLeadEvent, createLeadSource]);

  // Enhanced event helpers with lead tracking
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

  return {
    sendEvent,
    trackPageView,
    trackViewContent,
    trackLead,
    trackPurchase,
    trackContact,
    trackCompleteRegistration,
    trackSearch
  };
};
