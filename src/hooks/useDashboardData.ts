import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook for fetching widget data with caching and error handling
export function useDashboardWidget(widgetType: string, tenantId?: string) {
  return useQuery({
    queryKey: ['dashboard-widget', widgetType, tenantId],
    queryFn: async () => {
      // In a real implementation, this would call the actual API endpoints
      // For now, return mock data based on widget type
      
      switch (widgetType) {
        case 'visibility':
          return { date: "2025-08-01", score: 87, trend: 5, previousScore: 82 };
          
        case 'reviews':
          return { 
            count: 42, 
            avg_rating: 4.3, 
            latest: { 
              author: "Max M.", 
              rating: 5, 
              text: "Fantastisches Essen und super Service!", 
              date: "2025-08-01", 
              platform: "Google" 
            }
          };
          
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