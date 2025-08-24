import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Utility functions for score calculations
const calculateVisibilityScore = (profile: any) => {
  if (!profile) return 0;
  
  const ratingScore = profile.google_rating ? (profile.google_rating / 5) * 40 : 0;
  const reviewsScore = Math.min((profile.google_reviews_count || 0) / 2, 30);
  const photosScore = Math.min((profile.google_photos?.length || 0) * 5, 30);
  
  return Math.round(ratingScore + reviewsScore + photosScore);
};

const calculateTrend = (profile: any) => {
  // Simple trend calculation based on recent activity
  const recentActivity = (profile.gmb_posts?.length || 0) + (profile.google_photos?.length || 0);
  return recentActivity > 10 ? 5 : recentActivity > 5 ? 2 : -1;
};

// Hook for fetching widget data with caching and error handling
export function useDashboardWidget(widgetType: string, tenantId?: string) {
  return useQuery({
    queryKey: ['dashboard-widget', widgetType, tenantId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      switch (widgetType) {
        case 'visibility': {
          const { data: profile, error } = await supabase
            .from('business_profiles')
            .select('google_rating, google_reviews_count, google_photos, gmb_posts, vc_score, vc_last_run')
            .eq('user_id', user.id as any)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching visibility data:', error);
            return { score: 0, trend: 0, previousScore: 0, date: new Date().toISOString() };
          }
          
          if (!profile) {
            return { score: 0, trend: 0, previousScore: 0, date: new Date().toISOString(), noData: true };
          }
          
          const score = (profile as any).vc_score || calculateVisibilityScore(profile);
          const trend = calculateTrend(profile);
          
          return { 
            score, 
            trend, 
            previousScore: Math.max(0, score - trend),
            date: (profile as any).vc_last_run || new Date().toISOString()
          };
        }
          
        case 'reviews': {
          const { data: profile, error } = await supabase
            .from('business_profiles')
            .select('google_rating, google_reviews_count, gmb_posts')
            .eq('user_id', user.id as any)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching reviews data:', error);
            return { count: 0, avg_rating: 0, latest: null };
          }
          
          if (!profile) {
            return { count: 0, avg_rating: 0, latest: null, noData: true };
          }
          
          // Extract latest review from gmb_posts if available
          const latestPost = (profile as any).gmb_posts?.[0];
          const latest = latestPost ? {
            author: "Google Nutzer",
            rating: (profile as any).google_rating || 0,
            text: latestPost.summary || "Keine aktuellen Bewertungen verfügbar",
            date: latestPost.createTime || new Date().toISOString(),
            platform: "Google"
          } : null;
          
          return { 
            count: (profile as any).google_reviews_count || 0, 
            avg_rating: (profile as any).google_rating || 0, 
            latest
          };
        }
          
        case 'orders':
          return [
            { platform: "UberEats", total_orders: 120, revenue: 2400.50, growth: 15 },
            { platform: "Lieferando", total_orders: 89, revenue: 1780.30, growth: 8 },
            { platform: "Delivery Hero", total_orders: 45, revenue: 920.00, growth: -3 }
          ];
          
        case 'reservations':
          return { 
            total_reservations: 35, 
            no_show_rate: 0.08,
            upcoming_reservations: 12,
            capacity_utilization: 0.75,
            avg_party_size: 3.2
          };
          
        case 'ads':
          return { 
            ad_spend: 500, 
            clicks: 1200, 
            ctr: 0.05, 
            cpa: 0.42,
            impressions: 24000,
            conversions: 15,
            roas: 3.2
          };
          
        case 'booking':
          return [
            { source: "TripAdvisor", avg_score: 4.2, views: 800, ranking: 15, reviews_count: 127, trend: 5 },
            { source: "TheFork", avg_score: 4.5, views: 450, ranking: 8, reviews_count: 89, trend: 12 },
            { source: "Booking.com", avg_score: 4.1, views: 320, ranking: 22, reviews_count: 65, trend: -2 }
          ];
          
        default:
          return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    retry: 3,
  });
}

// Hook for refreshing all dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  const refreshAllWidgets = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard-widget'] });
  };

  return { refreshAllWidgets };
}

// Hook for dashboard settings and feature flags
export function useDashboardSettings(userId?: string) {
  return useQuery({
    queryKey: ['dashboard-settings', userId],
    queryFn: async () => {
      // Mock settings - in real implementation, fetch from user preferences
      return {
        enabledWidgets: [
          'visibilityWidget',
          'reviewsWidget', 
          'ordersWidget',
          'reservationWidget',
          'adAnalyticsWidget',
          'bookingWidget'
        ],
        refreshInterval: 'daily', // 'hourly', 'daily', 'manual'
        userRole: 'manager', // 'admin', 'manager', 'user'
        notifications: true,
        autoRefresh: true
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}