export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addon_services: {
        Row: {
          category: string
          compatible_packages: string[] | null
          created_at: string | null
          description: string | null
          description_translations: Json | null
          features: string[] | null
          features_translations: Json | null
          id: string
          is_active: boolean | null
          name: string
          name_translations: Json | null
          original_price: number | null
          period: string
          price: number
          requires_base_package: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          compatible_packages?: string[] | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          features?: string[] | null
          features_translations?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          name_translations?: Json | null
          original_price?: number | null
          period?: string
          price: number
          requires_base_package?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          compatible_packages?: string[] | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          features?: string[] | null
          features_translations?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_translations?: Json | null
          original_price?: number | null
          period?: string
          price?: number
          requires_base_package?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string
          estimated_impact: string | null
          expires_at: string | null
          id: string
          implementation_difficulty: string | null
          metadata: Json | null
          partner_id: string
          priority: string | null
          recommendation_type: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description: string
          estimated_impact?: string | null
          expires_at?: string | null
          id?: string
          implementation_difficulty?: string | null
          metadata?: Json | null
          partner_id: string
          priority?: string | null
          recommendation_type: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string
          estimated_impact?: string | null
          expires_at?: string | null
          id?: string
          implementation_difficulty?: string | null
          metadata?: Json | null
          partner_id?: string
          priority?: string | null
          recommendation_type?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string | null
          event: string | null
          partner_id: string | null
        }
        Insert: {
          created_at?: string | null
          event?: string | null
          partner_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string | null
          partner_id?: string | null
        }
        Relationships: []
      }
      business_partners: {
        Row: {
          address: string | null
          billing_address: Json | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          document_uploaded: boolean | null
          google_account_id: string | null
          id: string
          notes: string | null
          onboarding_completed: boolean | null
          profile_verified: boolean | null
          services_selected: string[] | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: Json | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document_uploaded?: boolean | null
          google_account_id?: string | null
          id?: string
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_verified?: boolean | null
          services_selected?: string[] | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: Json | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document_uploaded?: boolean | null
          google_account_id?: string | null
          id?: string
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_verified?: boolean | null
          services_selected?: string[] | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          address: string
          business_name: string
          created_at: string | null
          go_live: boolean | null
          google_connected: boolean | null
          google_place_id: string | null
          id: string
          last_updated: string | null
          opening_hours: Json | null
          partner_id: string
          phone: string | null
          photos: string[] | null
          rating: number | null
          review_count: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address: string
          business_name: string
          created_at?: string | null
          go_live?: boolean | null
          google_connected?: boolean | null
          google_place_id?: string | null
          id?: string
          last_updated?: string | null
          opening_hours?: Json | null
          partner_id: string
          phone?: string | null
          photos?: string[] | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          business_name?: string
          created_at?: string | null
          go_live?: boolean | null
          google_connected?: boolean | null
          google_place_id?: string | null
          id?: string
          last_updated?: string | null
          opening_hours?: Json | null
          partner_id?: string
          phone?: string | null
          photos?: string[] | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_requests: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          service_interest: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_interest?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_interest?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dudle_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string | null
          restaurant_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text?: string | null
          restaurant_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string | null
          restaurant_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dudle_options_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "dudle_options_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dudle_options_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dudle_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dudle_participants: {
        Row: {
          email: string
          id: string
          invited_at: string | null
          responded_at: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          invited_at?: string | null
          responded_at?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          invited_at?: string | null
          responded_at?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dudle_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dudle_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dudle_sessions: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          expires_at: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dudle_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          participant_id: string | null
          session_id: string
          user_id: string | null
          vote_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          participant_id?: string | null
          session_id: string
          user_id?: string | null
          vote_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          participant_id?: string | null
          session_id?: string
          user_id?: string | null
          vote_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dudle_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "dudle_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dudle_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "dudle_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dudle_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dudle_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ga4_daily: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          date: string
          device_breakdown: Json | null
          id: string
          page_views: number | null
          partner_id: string
          sessions: number | null
          top_pages: Json | null
          top_queries: Json | null
          traffic_sources: Json | null
          unique_users: number | null
          updated_at: string | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date: string
          device_breakdown?: Json | null
          id?: string
          page_views?: number | null
          partner_id: string
          sessions?: number | null
          top_pages?: Json | null
          top_queries?: Json | null
          traffic_sources?: Json | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          device_breakdown?: Json | null
          id?: string
          page_views?: number | null
          partner_id?: string
          sessions?: number | null
          top_pages?: Json | null
          top_queries?: Json | null
          traffic_sources?: Json | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ga4_daily_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_profiles: {
        Row: {
          address: string | null
          business_name: string | null
          category: string | null
          created_at: string | null
          google_location_id: string | null
          google_rating: number | null
          id: string
          last_synced: string | null
          partner_id: string
          phone: string | null
          photos_count: number | null
          posts_count: number | null
          snapshot_date: string
          total_reviews: number | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          google_location_id?: string | null
          google_rating?: number | null
          id?: string
          last_synced?: string | null
          partner_id: string
          phone?: string | null
          photos_count?: number | null
          posts_count?: number | null
          snapshot_date?: string
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          google_location_id?: string | null
          google_rating?: number | null
          id?: string
          last_synced?: string | null
          partner_id?: string
          phone?: string | null
          photos_count?: number | null
          posts_count?: number | null
          snapshot_date?: string
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gmb_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      google_job_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          job_type: string
          location_id: string | null
          partner_id: string
          payload: Json
          retry_count: number | null
          run_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          job_type: string
          location_id?: string | null
          partner_id: string
          payload: Json
          retry_count?: number | null
          run_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          job_type?: string
          location_id?: string | null
          partner_id?: string
          payload?: Json
          retry_count?: number | null
          run_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          consent_given: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          google_user_id: string
          id: string
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          google_user_id: string
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          google_user_id?: string
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      matching_performance: {
        Row: {
          algorithm_version: string | null
          created_at: string | null
          criteria_weights: Json | null
          id: string
          match_score: number
          restaurant_id: string | null
          session_id: string | null
          user_action: string | null
          user_id: string | null
        }
        Insert: {
          algorithm_version?: string | null
          created_at?: string | null
          criteria_weights?: Json | null
          id?: string
          match_score: number
          restaurant_id?: string | null
          session_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Update: {
          algorithm_version?: string | null
          created_at?: string | null
          criteria_weights?: Json | null
          id?: string
          match_score?: number
          restaurant_id?: string | null
          session_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_performance_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "matching_performance_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          total_budget: number | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          total_budget?: number | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          total_budget?: number | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          created_at: string
          day_of_week: number | null
          estimated_calories: number | null
          estimated_cost: number | null
          id: string
          meal_plan_id: string | null
          meal_type: string
          notes: string | null
          recipe_title: string | null
          restaurant_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          estimated_calories?: number | null
          estimated_cost?: number | null
          id?: string
          meal_plan_id?: string | null
          meal_type: string
          notes?: string | null
          recipe_title?: string | null
          restaurant_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          estimated_calories?: number | null
          estimated_cost?: number | null
          id?: string
          meal_plan_id?: string | null
          meal_type?: string
          notes?: string | null
          recipe_title?: string | null
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "meals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string | null
          id: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          title: string
        }
        Update: {
          created_at?: string | null
          id?: never
          title?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          cost: number | null
          created_at: string
          custom_meal_name: string | null
          date: string
          fat: number | null
          fiber: number | null
          id: string
          meal_type: string
          notes: string | null
          protein: number | null
          recipe_id: string | null
          restaurant_id: string | null
          sodium: number | null
          sugar: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          cost?: number | null
          created_at?: string
          custom_meal_name?: string | null
          date: string
          fat?: number | null
          fiber?: number | null
          id?: string
          meal_type: string
          notes?: string | null
          protein?: number | null
          recipe_id?: string | null
          restaurant_id?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          cost?: number | null
          created_at?: string
          custom_meal_name?: string | null
          date?: string
          fat?: number | null
          fiber?: number | null
          id?: string
          meal_type?: string
          notes?: string | null
          protein?: number | null
          recipe_id?: string | null
          restaurant_id?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "nutrition_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_event_logs: {
        Row: {
          action_performed: string | null
          context: Json | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          partner_id: string | null
          provider: string
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_performed?: string | null
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          partner_id?: string | null
          provider?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_performed?: string | null
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          partner_id?: string | null
          provider?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_event_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_bookings: {
        Row: {
          activated_at: string | null
          booking_date: string | null
          created_at: string | null
          expires_at: string | null
          go_live_at: string | null
          go_live_required: boolean | null
          id: string
          invoice_url: string | null
          partner_id: string | null
          payment_intent_id: string | null
          payment_status: string | null
          price: number
          service_name: string
          service_slug: string
          service_type: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          booking_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          go_live_at?: string | null
          go_live_required?: boolean | null
          id?: string
          invoice_url?: string | null
          partner_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          price: number
          service_name: string
          service_slug: string
          service_type: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          booking_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          go_live_at?: string | null
          go_live_required?: boolean | null
          id?: string
          invoice_url?: string | null
          partner_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          price?: number
          service_name?: string
          service_slug?: string
          service_type?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_onboarding_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          id: string
          partner_id: string | null
          step_name: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          partner_id?: string | null
          step_name: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          partner_id?: string | null
          step_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_onboarding_steps_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_upload_quota: {
        Row: {
          month_start: string
          partner_id: string
          uploads_used: number | null
        }
        Insert: {
          month_start: string
          partner_id: string
          uploads_used?: number | null
        }
        Update: {
          month_start?: string
          partner_id?: string
          uploads_used?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string[] | null
          created_at: string
          id: string
          language: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string
          id: string
          language?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string
          id?: string
          language?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string
          created_by: string | null
          cuisine_type: string | null
          description: string | null
          dietary_tags: string[] | null
          difficulty: string | null
          estimated_cost: number | null
          id: string
          ingredients: Json
          instructions: Json
          is_public: boolean | null
          nutrition_per_serving: Json | null
          prep_time: number | null
          servings: number | null
          title: string
          updated_at: string
        }
        Insert: {
          cook_time?: number | null
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty?: string | null
          estimated_cost?: number | null
          id?: string
          ingredients?: Json
          instructions?: Json
          is_public?: boolean | null
          nutrition_per_serving?: Json | null
          prep_time?: number | null
          servings?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          cook_time?: number | null
          created_at?: string
          created_by?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty?: string | null
          estimated_cost?: number | null
          id?: string
          ingredients?: Json
          instructions?: Json
          is_public?: boolean | null
          nutrition_per_serving?: Json | null
          prep_time?: number | null
          servings?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_analytics: {
        Row: {
          click_through_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          dudle_selections: number | null
          id: string
          profile_views: number | null
          recommendation_count: number | null
          restaurant_id: string | null
          social_shares: number | null
        }
        Insert: {
          click_through_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          dudle_selections?: number | null
          id?: string
          profile_views?: number | null
          recommendation_count?: number | null
          restaurant_id?: string | null
          social_shares?: number | null
        }
        Update: {
          click_through_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          dudle_selections?: number | null
          id?: string
          profile_views?: number | null
          recommendation_count?: number | null
          restaurant_id?: string | null
          social_shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_analytics_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_analytics_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_features: {
        Row: {
          accepts_reservations: boolean | null
          accessibility_features: string[] | null
          atmosphere_tags: string[] | null
          created_at: string
          has_delivery: boolean | null
          has_diabetic_friendly: boolean | null
          has_gluten_free_options: boolean | null
          has_takeout: boolean | null
          has_vegan_options: boolean | null
          has_vegetarian_options: boolean | null
          id: string
          payment_methods: string[] | null
          price_range: string | null
          restaurant_id: string | null
          updated_at: string
        }
        Insert: {
          accepts_reservations?: boolean | null
          accessibility_features?: string[] | null
          atmosphere_tags?: string[] | null
          created_at?: string
          has_delivery?: boolean | null
          has_diabetic_friendly?: boolean | null
          has_gluten_free_options?: boolean | null
          has_takeout?: boolean | null
          has_vegan_options?: boolean | null
          has_vegetarian_options?: boolean | null
          id?: string
          payment_methods?: string[] | null
          price_range?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Update: {
          accepts_reservations?: boolean | null
          accessibility_features?: string[] | null
          atmosphere_tags?: string[] | null
          created_at?: string
          has_delivery?: boolean | null
          has_diabetic_friendly?: boolean | null
          has_gluten_free_options?: boolean | null
          has_takeout?: boolean | null
          has_vegan_options?: boolean | null
          has_vegetarian_options?: boolean | null
          id?: string
          payment_methods?: string[] | null
          price_range?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_features_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_features_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          code: string
          created_at: string | null
          default_name: string
          id: string
          interval_months: number | null
          is_active: boolean | null
          is_recurring: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_name: string
          id?: string
          interval_months?: number | null
          is_active?: boolean | null
          is_recurring?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_name?: string
          id?: string
          interval_months?: number | null
          is_active?: boolean | null
          is_recurring?: boolean | null
        }
        Relationships: []
      }
      service_packages_legacy: {
        Row: {
          badge_translations: Json | null
          base_price: number
          created_at: string | null
          description: string | null
          description_translations: Json | null
          features: string[] | null
          features_translations: Json | null
          id: string
          is_active: boolean | null
          is_recommended: boolean | null
          min_duration_months: number | null
          name: string
          name_translations: Json | null
          original_price: number | null
          period: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          badge_translations?: Json | null
          base_price: number
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          features?: string[] | null
          features_translations?: Json | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          min_duration_months?: number | null
          name: string
          name_translations?: Json | null
          original_price?: number | null
          period?: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          badge_translations?: Json | null
          base_price?: number
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          features?: string[] | null
          features_translations?: Json | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          min_duration_months?: number | null
          name?: string
          name_translations?: Json | null
          original_price?: number | null
          period?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_price_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_price: number
          old_price: number | null
          reason: string | null
          service_id: string
          service_type: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_price: number
          old_price?: number | null
          reason?: string | null
          service_id: string
          service_type: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number | null
          reason?: string | null
          service_id?: string
          service_type?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          currency: string | null
          id: string
          normal_price_cents: number
          package_id: string | null
          promo_active: boolean | null
          promo_price_cents: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          currency?: string | null
          id?: string
          normal_price_cents: number
          package_id?: string | null
          promo_active?: boolean | null
          promo_price_cents?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          currency?: string | null
          id?: string
          normal_price_cents?: number
          package_id?: string | null
          promo_active?: boolean | null
          promo_price_cents?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          category: string | null
          created_at: string
          estimated_price: number | null
          id: string
          ingredient_name: string
          is_purchased: boolean | null
          notes: string | null
          quantity: string
          shopping_list_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          ingredient_name: string
          is_purchased?: boolean | null
          notes?: string | null
          quantity: string
          shopping_list_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          ingredient_name?: string
          is_purchased?: boolean | null
          notes?: string | null
          quantity?: string
          shopping_list_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          meal_plan_id: string | null
          status: string | null
          title: string
          total_estimated_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_plan_id?: string | null
          status?: string | null
          title: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_plan_id?: string | null
          status?: string | null
          title?: string
          total_estimated_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_channels: {
        Row: {
          base_price: number
          created_at: string | null
          description: string | null
          icon_name: string
          id: string
          is_active: boolean | null
          name: string
          platform: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          description?: string | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          name: string
          platform: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_dietary_profiles: {
        Row: {
          allergies: string[] | null
          budget_max: number | null
          budget_min: number | null
          calorie_goal: number | null
          carb_goal: number | null
          created_at: string
          cuisine_preferences: string[] | null
          diabetes_type: string | null
          dietary_restrictions: string[] | null
          fat_goal: number | null
          health_conditions: string[] | null
          id: string
          is_diabetic: boolean | null
          preferred_meal_times: string[] | null
          protein_goal: number | null
          spice_tolerance: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          calorie_goal?: number | null
          carb_goal?: number | null
          created_at?: string
          cuisine_preferences?: string[] | null
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          fat_goal?: number | null
          health_conditions?: string[] | null
          id?: string
          is_diabetic?: boolean | null
          preferred_meal_times?: string[] | null
          protein_goal?: number | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          calorie_goal?: number | null
          carb_goal?: number | null
          created_at?: string
          cuisine_preferences?: string[] | null
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          fat_goal?: number | null
          health_conditions?: string[] | null
          id?: string
          is_diabetic?: boolean | null
          preferred_meal_times?: string[] | null
          protein_goal?: number | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          allergens: string[] | null
          atmosphere_preferences: string[] | null
          avoid_ingredients: string[] | null
          budget_per_person_max: number | null
          budget_per_person_min: number | null
          created_at: string | null
          dietary_restrictions: string[] | null
          group_size: number | null
          id: string
          language: string | null
          max_distance_km: number | null
          meal_times: string[] | null
          preferred_cuisines: string[] | null
          price_range: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allergens?: string[] | null
          atmosphere_preferences?: string[] | null
          avoid_ingredients?: string[] | null
          budget_per_person_max?: number | null
          budget_per_person_min?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          group_size?: number | null
          id?: string
          language?: string | null
          max_distance_km?: number | null
          meal_times?: string[] | null
          preferred_cuisines?: string[] | null
          price_range?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allergens?: string[] | null
          atmosphere_preferences?: string[] | null
          avoid_ingredients?: string[] | null
          budget_per_person_max?: number | null
          budget_per_person_min?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          group_size?: number | null
          id?: string
          language?: string | null
          max_distance_km?: number | null
          meal_times?: string[] | null
          preferred_cuisines?: string[] | null
          price_range?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_shares: {
        Row: {
          caption: string | null
          comments_count: number | null
          engagement_score: number | null
          external_post_id: string | null
          id: string
          likes_count: number | null
          media_url: string | null
          platform: string
          restaurant_id: string | null
          share_type: string | null
          shared_at: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          engagement_score?: number | null
          external_post_id?: string | null
          id?: string
          likes_count?: number | null
          media_url?: string | null
          platform: string
          restaurant_id?: string | null
          share_type?: string | null
          shared_at?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          engagement_score?: number | null
          external_post_id?: string | null
          id?: string
          likes_count?: number | null
          media_url?: string | null
          platform?: string
          restaurant_id?: string | null
          share_type?: string | null
          shared_at?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_shares_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_match_scores"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "user_shares_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          browser: string | null
          consent_gdpr: boolean | null
          created_at: string | null
          device: string | null
          email: string
          id: string
          interests: string[] | null
          ip_address: string | null
          language: string | null
          os: string | null
          referrer: string | null
          service_slug: string | null
          source: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          consent_gdpr?: boolean | null
          created_at?: string | null
          device?: string | null
          email: string
          id?: string
          interests?: string[] | null
          ip_address?: string | null
          language?: string | null
          os?: string | null
          referrer?: string | null
          service_slug?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          consent_gdpr?: boolean | null
          created_at?: string | null
          device?: string | null
          email?: string
          id?: string
          interests?: string[] | null
          ip_address?: string | null
          language?: string | null
          os?: string | null
          referrer?: string | null
          service_slug?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_booking_details: {
        Row: {
          activated_at: string | null
          booking_date: string | null
          computed_status: string | null
          created_at: string | null
          days_until_expiry: number | null
          expires_at: string | null
          id: string | null
          partner_email: string | null
          partner_name: string | null
          partner_phone: string | null
          partner_status: string | null
          payment_status: string | null
          price: number | null
          service_name: string | null
          service_slug: string | null
          service_type: string | null
          status: string | null
        }
        Relationships: []
      }
      admin_booking_kpis: {
        Row: {
          cancellations: number | null
          conversion_rate: number | null
          new_partners_today: number | null
          total_bookings: number | null
        }
        Relationships: []
      }
      admin_booking_metrics_by_month: {
        Row: {
          active_bookings: number | null
          cancelled_bookings: number | null
          month: string | null
          unique_partners: number | null
        }
        Relationships: []
      }
      admin_booking_revenue_analytics: {
        Row: {
          active_bookings: number | null
          active_revenue: number | null
          avg_booking_value: number | null
          cancelled_bookings: number | null
          month: string | null
          service_type: string | null
          total_bookings: number | null
          total_revenue: number | null
          unique_partners: number | null
        }
        Relationships: []
      }
      restaurant_match_scores: {
        Row: {
          address: string | null
          avg_daily_views: number | null
          avg_rating: number | null
          cuisine_type: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          popularity_score: number | null
          restaurant_id: string | null
          review_count: number | null
          share_count: number | null
          total_social_likes: number | null
          verified: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_business_profile: {
        Args: { partner_id_param: string }
        Returns: {
          id: string
          partner_id: string
          business_name: string
          address: string
          opening_hours: Json
          photos: string[]
          reviews: Json
          rating: number
          review_count: number
          last_updated: string
          google_place_id: string
          phone: string
          website: string
          created_at: string
          updated_at: string
        }[]
      }
      get_visibility_score: {
        Args: { partner_id_param: string }
        Returns: {
          id: string
          partner_id: string
          business_name: string
          rating: number
          review_count: number
          last_updated: string
          rating_score: number
          review_score: number
          photo_score: number
          hours_score: number
          freshness_score: number
          visibility_score: number
        }[]
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      refresh_restaurant_match_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_business_profile: {
        Args: {
          p_partner_id: string
          p_business_name: string
          p_address: string
          p_phone?: string
          p_website?: string
          p_rating?: number
          p_review_count?: number
          p_photos?: string[]
          p_opening_hours?: Json
        }
        Returns: {
          address: string
          business_name: string
          created_at: string | null
          go_live: boolean | null
          google_connected: boolean | null
          google_place_id: string | null
          id: string
          last_updated: string | null
          opening_hours: Json | null
          partner_id: string
          phone: string | null
          photos: string[] | null
          rating: number | null
          review_count: number | null
          updated_at: string | null
          website: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
