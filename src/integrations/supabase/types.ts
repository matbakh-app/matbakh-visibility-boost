export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
      alerts: {
        Row: {
          category: string | null
          id: string
          message: string | null
          partner_id: string | null
          sent_at: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          message?: string | null
          partner_id?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          message?: string | null
          partner_id?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_tagging_jobs: {
        Row: {
          error_message: string | null
          id: string
          run_finished_at: string | null
          run_started_at: string
          status: string | null
          total_categories_processed: number | null
          total_tags_created: number | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          run_finished_at?: string | null
          run_started_at?: string
          status?: string | null
          total_categories_processed?: number | null
          total_tags_created?: number | null
        }
        Update: {
          error_message?: string | null
          id?: string
          run_finished_at?: string | null
          run_started_at?: string
          status?: string | null
          total_categories_processed?: number | null
          total_tags_created?: number | null
        }
        Relationships: []
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
      business_contact_data: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          company_name: string
          competitors: Json | null
          contact_email: string
          contact_phone: string
          contact_website: string | null
          country: string
          created_at: string
          customer_id: string
          data_source: string
          house_number: string
          id: string
          last_enriched_at: string | null
          postal_code: string
          region: string | null
          socials: Json | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          company_name: string
          competitors?: Json | null
          contact_email: string
          contact_phone: string
          contact_website?: string | null
          country: string
          created_at?: string
          customer_id: string
          data_source?: string
          house_number: string
          id?: string
          last_enriched_at?: string | null
          postal_code: string
          region?: string | null
          socials?: Json | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          company_name?: string
          competitors?: Json | null
          contact_email?: string
          contact_phone?: string
          contact_website?: string | null
          country?: string
          created_at?: string
          customer_id?: string
          data_source?: string
          house_number?: string
          id?: string
          last_enriched_at?: string | null
          postal_code?: string
          region?: string | null
          socials?: Json | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_contact_data_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partners: {
        Row: {
          address: string | null
          billing_address: Json | null
          business_model: string[] | null
          categories: Json | null
          category_ids: string[] | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          document_uploaded: boolean | null
          go_live: boolean | null
          google_account_id: string | null
          google_connected: boolean | null
          id: string
          location: unknown | null
          notes: string | null
          onboarding_completed: boolean | null
          opening_hours: string[] | null
          profile_verified: boolean | null
          revenue_streams: string[] | null
          seating_capacity: number | null
          services_selected: string[] | null
          special_features: Json | null
          status: string | null
          target_audience: string[] | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: Json | null
          business_model?: string[] | null
          categories?: Json | null
          category_ids?: string[] | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          document_uploaded?: boolean | null
          go_live?: boolean | null
          google_account_id?: string | null
          google_connected?: boolean | null
          id?: string
          location?: unknown | null
          notes?: string | null
          onboarding_completed?: boolean | null
          opening_hours?: string[] | null
          profile_verified?: boolean | null
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          services_selected?: string[] | null
          special_features?: Json | null
          status?: string | null
          target_audience?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: Json | null
          business_model?: string[] | null
          categories?: Json | null
          category_ids?: string[] | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          document_uploaded?: boolean | null
          go_live?: boolean | null
          google_account_id?: string | null
          google_connected?: boolean | null
          id?: string
          location?: unknown | null
          notes?: string | null
          onboarding_completed?: boolean | null
          opening_hours?: string[] | null
          profile_verified?: boolean | null
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          services_selected?: string[] | null
          special_features?: Json | null
          status?: string | null
          target_audience?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          address: string | null
          address_line2: string | null
          bank_account: string | null
          business_hours: Json | null
          business_license: string | null
          card_cvc: string | null
          card_expiry: string | null
          card_number: string | null
          categories: string[] | null
          city: string | null
          commercial_register: string | null
          company_name: string
          country: string | null
          created_at: string | null
          data_sources: string[] | null
          description: string | null
          email: string | null
          facebook_about: string | null
          facebook_followers: number | null
          facebook_page_category: string | null
          facebook_page_id: string | null
          facebook_posts_count: number | null
          gmb_attributes: Json | null
          gmb_posts: Json | null
          gmb_social_links: Json | null
          gmb_verification_status: string | null
          google_connected: boolean
          google_photos: Json | null
          google_places_id: string | null
          google_rating: number | null
          google_reviews_count: number | null
          house_number: string | null
          id: string
          instagram_business_id: string | null
          instagram_followers: number | null
          instagram_handle: string | null
          legal_entity: string | null
          messenger_integration: boolean | null
          onboarding_completed: boolean | null
          owner_name: string | null
          payment_methods: string[] | null
          paypal_email: string | null
          phone: string | null
          postal_code: string | null
          profile_verified: boolean | null
          registration_type: string | null
          services: string[] | null
          street: string | null
          stripe_account: string | null
          subscription: string | null
          target_audience: string[] | null
          tax_number: string | null
          updated_at: string | null
          user_id: string
          vat_id: string | null
          vc_completed: boolean | null
          vc_last_run: string | null
          vc_results: Json | null
          vc_score: number | null
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          address_line2?: string | null
          bank_account?: string | null
          business_hours?: Json | null
          business_license?: string | null
          card_cvc?: string | null
          card_expiry?: string | null
          card_number?: string | null
          categories?: string[] | null
          city?: string | null
          commercial_register?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          data_sources?: string[] | null
          description?: string | null
          email?: string | null
          facebook_about?: string | null
          facebook_followers?: number | null
          facebook_page_category?: string | null
          facebook_page_id?: string | null
          facebook_posts_count?: number | null
          gmb_attributes?: Json | null
          gmb_posts?: Json | null
          gmb_social_links?: Json | null
          gmb_verification_status?: string | null
          google_connected?: boolean
          google_photos?: Json | null
          google_places_id?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          house_number?: string | null
          id?: string
          instagram_business_id?: string | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          legal_entity?: string | null
          messenger_integration?: boolean | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          payment_methods?: string[] | null
          paypal_email?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_verified?: boolean | null
          registration_type?: string | null
          services?: string[] | null
          street?: string | null
          stripe_account?: string | null
          subscription?: string | null
          target_audience?: string[] | null
          tax_number?: string | null
          updated_at?: string | null
          user_id: string
          vat_id?: string | null
          vc_completed?: boolean | null
          vc_last_run?: string | null
          vc_results?: Json | null
          vc_score?: number | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          address_line2?: string | null
          bank_account?: string | null
          business_hours?: Json | null
          business_license?: string | null
          card_cvc?: string | null
          card_expiry?: string | null
          card_number?: string | null
          categories?: string[] | null
          city?: string | null
          commercial_register?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          data_sources?: string[] | null
          description?: string | null
          email?: string | null
          facebook_about?: string | null
          facebook_followers?: number | null
          facebook_page_category?: string | null
          facebook_page_id?: string | null
          facebook_posts_count?: number | null
          gmb_attributes?: Json | null
          gmb_posts?: Json | null
          gmb_social_links?: Json | null
          gmb_verification_status?: string | null
          google_connected?: boolean
          google_photos?: Json | null
          google_places_id?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          house_number?: string | null
          id?: string
          instagram_business_id?: string | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          legal_entity?: string | null
          messenger_integration?: boolean | null
          onboarding_completed?: boolean | null
          owner_name?: string | null
          payment_methods?: string[] | null
          paypal_email?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_verified?: boolean | null
          registration_type?: string | null
          services?: string[] | null
          street?: string | null
          stripe_account?: string | null
          subscription?: string | null
          target_audience?: string[] | null
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string
          vat_id?: string | null
          vc_completed?: boolean | null
          vc_last_run?: string | null
          vc_results?: Json | null
          vc_score?: number | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      category_cross_tags: {
        Row: {
          category_id: string
          confidence_score: number | null
          created_at: string
          id: string
          source: string
          target_main_category: string
          target_main_category_id: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          source: string
          target_main_category: string
          target_main_category_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          source?: string
          target_main_category?: string
          target_main_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_cross_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gmb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_cross_tags_target_main_category_id_fkey"
            columns: ["target_main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cct_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gmb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cct_target_fk"
            columns: ["target_main_category_id"]
            isOneToOne: false
            referencedRelation: "gmb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_search_logs: {
        Row: {
          id: string
          result_category_ids: string[] | null
          search_term: string
          search_timestamp: string
          selected_category_id: string | null
          selected_main_categories: string[]
          user_id: string | null
        }
        Insert: {
          id?: string
          result_category_ids?: string[] | null
          search_term: string
          search_timestamp?: string
          selected_category_id?: string | null
          selected_main_categories: string[]
          user_id?: string | null
        }
        Update: {
          id?: string
          result_category_ids?: string[] | null
          search_term?: string
          search_timestamp?: string
          selected_category_id?: string | null
          selected_main_categories?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_search_logs_selected_category_id_fkey"
            columns: ["selected_category_id"]
            isOneToOne: false
            referencedRelation: "gmb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_specifics: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          key: string
          partner_id: string | null
          value: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          key: string
          partner_id?: string | null
          value?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          key?: string
          partner_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_specifics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gmb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_specifics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      category_tag_events: {
        Row: {
          category_cross_tag_id: string | null
          change_type: string | null
          changed_by: string | null
          comment: string | null
          event_timestamp: string
          id: string
          new_confidence: number | null
          new_source: string | null
          old_confidence: number | null
          old_source: string | null
        }
        Insert: {
          category_cross_tag_id?: string | null
          change_type?: string | null
          changed_by?: string | null
          comment?: string | null
          event_timestamp?: string
          id?: string
          new_confidence?: number | null
          new_source?: string | null
          old_confidence?: number | null
          old_source?: string | null
        }
        Update: {
          category_cross_tag_id?: string | null
          change_type?: string | null
          changed_by?: string | null
          comment?: string | null
          event_timestamp?: string
          id?: string
          new_confidence?: number | null
          new_source?: string | null
          old_confidence?: number | null
          old_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_tag_events_category_cross_tag_id_fkey"
            columns: ["category_cross_tag_id"]
            isOneToOne: false
            referencedRelation: "category_cross_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_analysis: {
        Row: {
          competitor_name: string
          competitor_score: number | null
          competitor_url: string | null
          created_at: string | null
          gap_analysis: Json | null
          id: string
          lead_id: string
          our_score: number | null
          platform: string
          recommendations: string[] | null
          updated_at: string | null
        }
        Insert: {
          competitor_name: string
          competitor_score?: number | null
          competitor_url?: string | null
          created_at?: string | null
          gap_analysis?: Json | null
          id?: string
          lead_id: string
          our_score?: number | null
          platform: string
          recommendations?: string[] | null
          updated_at?: string | null
        }
        Update: {
          competitor_name?: string
          competitor_score?: number | null
          competitor_url?: string | null
          created_at?: string | null
          gap_analysis?: Json | null
          id?: string
          lead_id?: string
          our_score?: number | null
          platform?: string
          recommendations?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
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
      facebook_data_cache: {
        Row: {
          api_calls_count: number | null
          cache_expires_at: string | null
          created_at: string | null
          facebook_page_id: string | null
          facebook_user_id: string | null
          fetch_errors: Json | null
          followers_data: Json | null
          id: string
          insights_data: Json | null
          instagram_business_id: string | null
          instagram_data: Json | null
          last_fetched: string | null
          page_data: Json | null
          posts_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          cache_expires_at?: string | null
          created_at?: string | null
          facebook_page_id?: string | null
          facebook_user_id?: string | null
          fetch_errors?: Json | null
          followers_data?: Json | null
          id?: string
          insights_data?: Json | null
          instagram_business_id?: string | null
          instagram_data?: Json | null
          last_fetched?: string | null
          page_data?: Json | null
          posts_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          cache_expires_at?: string | null
          created_at?: string | null
          facebook_page_id?: string | null
          facebook_user_id?: string | null
          fetch_errors?: Json | null
          followers_data?: Json | null
          id?: string
          insights_data?: Json | null
          instagram_business_id?: string | null
          instagram_data?: Json | null
          last_fetched?: string | null
          page_data?: Json | null
          posts_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      facebook_oauth_tokens: {
        Row: {
          access_token: string
          consent_given: boolean
          consent_timestamp: string
          created_at: string
          email: string | null
          expires_at: string | null
          facebook_user_id: string
          id: string
          scopes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          consent_given?: boolean
          consent_timestamp?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          facebook_user_id: string
          id?: string
          scopes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          consent_given?: boolean
          consent_timestamp?: string
          created_at?: string
          email?: string | null
          expires_at?: string | null
          facebook_user_id?: string
          id?: string
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facebook_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          object_id: string | null
          object_type: string
          processed_at: string | null
          processing_status: string
          raw_payload: Json
          retry_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          object_id?: string | null
          object_type: string
          processed_at?: string | null
          processing_status?: string
          raw_payload?: Json
          retry_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          object_id?: string | null
          object_type?: string
          processed_at?: string | null
          processing_status?: string
          raw_payload?: Json
          retry_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      fb_conversion_logs: {
        Row: {
          error_message: string | null
          event_name: string
          event_payload: Json
          id: string
          partner_id: string | null
          pixel_id: string
          response_body: Json | null
          response_status: number | null
          sent_at: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          event_name: string
          event_payload: Json
          id?: string
          partner_id?: string | null
          pixel_id: string
          response_body?: Json | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          event_name?: string
          event_payload?: Json
          id?: string
          partner_id?: string | null
          pixel_id?: string
          response_body?: Json | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fb_conversion_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_conversions_config: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string | null
          pixel_id: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          pixel_id: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          pixel_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fb_conversions_config_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
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
      gmb_categories: {
        Row: {
          category_id: string
          category_path: string | null
          country_availability: string[] | null
          created_at: string
          description_de: string | null
          description_en: string | null
          haupt_kategorie: string | null
          id: string
          is_popular: boolean
          is_primary: boolean | null
          keywords: string[] | null
          main_category: string | null
          main_category_id: string | null
          name_de: string
          name_en: string
          parent_category_id: string | null
          parent_id: string | null
          public_id: number | null
          sort_order: number
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          category_id: string
          category_path?: string | null
          country_availability?: string[] | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          haupt_kategorie?: string | null
          id?: string
          is_popular?: boolean
          is_primary?: boolean | null
          keywords?: string[] | null
          main_category?: string | null
          main_category_id?: string | null
          name_de: string
          name_en: string
          parent_category_id?: string | null
          parent_id?: string | null
          public_id?: number | null
          sort_order?: number
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          category_path?: string | null
          country_availability?: string[] | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          haupt_kategorie?: string | null
          id?: string
          is_popular?: boolean
          is_primary?: boolean | null
          keywords?: string[] | null
          main_category?: string | null
          main_category_id?: string | null
          name_de?: string
          name_en?: string
          parent_category_id?: string | null
          parent_id?: string | null
          public_id?: number | null
          sort_order?: number
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmb_categories_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gmb_data_cache: {
        Row: {
          api_calls_count: number | null
          attributes_data: Json | null
          business_data: Json | null
          cache_expires_at: string | null
          created_at: string | null
          fetch_errors: Json | null
          google_places_id: string | null
          google_user_id: string | null
          id: string
          insights_data: Json | null
          last_fetched: string | null
          photos_data: Json | null
          posts_data: Json | null
          reviews_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          attributes_data?: Json | null
          business_data?: Json | null
          cache_expires_at?: string | null
          created_at?: string | null
          fetch_errors?: Json | null
          google_places_id?: string | null
          google_user_id?: string | null
          id?: string
          insights_data?: Json | null
          last_fetched?: string | null
          photos_data?: Json | null
          posts_data?: Json | null
          reviews_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          attributes_data?: Json | null
          business_data?: Json | null
          cache_expires_at?: string | null
          created_at?: string | null
          fetch_errors?: Json | null
          google_places_id?: string | null
          google_user_id?: string | null
          id?: string
          insights_data?: Json | null
          last_fetched?: string | null
          photos_data?: Json | null
          posts_data?: Json | null
          reviews_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          partner_id: string | null
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
          partner_id?: string | null
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
          partner_id?: string | null
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
          ads_customer_id: string | null
          consent_given: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          ga4_property_id: string | null
          gmb_account_id: string | null
          google_user_id: string
          id: string
          refresh_token: string | null
          scopes: string[] | null
          service_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          ads_customer_id?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          ga4_property_id?: string | null
          gmb_account_id?: string | null
          google_user_id: string
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          ads_customer_id?: string | null
          consent_given?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          ga4_property_id?: string | null
          gmb_account_id?: string | null
          google_user_id?: string
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      industry_benchmarks: {
        Row: {
          created_at: string | null
          data_source: string | null
          id: string
          industry: string
          last_updated: string | null
          location: string | null
          metric_name: string
          metric_value: number
          percentile_rank: number | null
          platform: string
          sample_size: number | null
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          industry: string
          last_updated?: string | null
          location?: string | null
          metric_name: string
          metric_value: number
          percentile_rank?: number | null
          platform: string
          sample_size?: number | null
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          industry?: string
          last_updated?: string | null
          location?: string | null
          metric_name?: string
          metric_value?: number
          percentile_rank?: number | null
          platform?: string
          sample_size?: number | null
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          event_payload: Json | null
          event_time: string
          event_type: string
          facebook_event_id: string | null
          id: string
          partner_id: string | null
          response_status: number | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          event_payload?: Json | null
          event_time?: string
          event_type: string
          facebook_event_id?: string | null
          id?: string
          partner_id?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          event_payload?: Json | null
          event_time?: string
          event_type?: string
          facebook_event_id?: string | null
          id?: string
          partner_id?: string | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      main_categories: {
        Row: {
          created_at: string
          description_de: string | null
          description_en: string | null
          id: string
          is_active: boolean
          name_de: string
          name_en: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          name_de: string
          name_en: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          name_de?: string
          name_en?: string
          slug?: string
          sort_order?: number
          updated_at?: string
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
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
      onboarding_questions: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          id: string
          options: Json | null
          order_index: number
          required: boolean
          slug: string
          step: number
          translations: Json
          type: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          required?: boolean
          slug: string
          step: number
          translations?: Json
          type: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          required?: boolean
          slug?: string
          step?: number
          translations?: Json
          type?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          id: string
          partner_id: string | null
          step_name: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          partner_id?: string | null
          step_name: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          partner_id?: string | null
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_partner_id_fkey"
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
      partner_kpis: {
        Row: {
          additional_kpis: Json | null
          annual_revenue: number | null
          created_at: string
          custom_features: Json | null
          employee_count: number | null
          food_cost_ratio: number | null
          id: string
          labor_cost_ratio: number | null
          opening_hours: Json | null
          partner_id: string
          seating_capacity: number | null
          social_handles: Json | null
          suppliers: string[] | null
          ugc_consent: boolean | null
          updated_at: string
        }
        Insert: {
          additional_kpis?: Json | null
          annual_revenue?: number | null
          created_at?: string
          custom_features?: Json | null
          employee_count?: number | null
          food_cost_ratio?: number | null
          id?: string
          labor_cost_ratio?: number | null
          opening_hours?: Json | null
          partner_id: string
          seating_capacity?: number | null
          social_handles?: Json | null
          suppliers?: string[] | null
          ugc_consent?: boolean | null
          updated_at?: string
        }
        Update: {
          additional_kpis?: Json | null
          annual_revenue?: number | null
          created_at?: string
          custom_features?: Json | null
          employee_count?: number | null
          food_cost_ratio?: number | null
          id?: string
          labor_cost_ratio?: number | null
          opening_hours?: Json | null
          partner_id?: string
          seating_capacity?: number | null
          social_handles?: Json | null
          suppliers?: string[] | null
          ugc_consent?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_kpis_partner_id_fkey"
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      partner_private_contacts: {
        Row: {
          contact_email: string
          contact_phone: string
          created_at: string
          customer_id: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_phone: string
          created_at?: string
          customer_id: string
          first_name: string
          id?: string
          last_name: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string
          created_at?: string
          customer_id?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_private_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profile_draft: {
        Row: {
          created_at: string | null
          id: string
          profile_data: Json
          test_mode: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_data?: Json
          test_mode?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_data?: Json
          test_mode?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      platform_recommendations: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_impact: string | null
          id: string
          implementation_difficulty: string | null
          lead_id: string
          metadata: Json | null
          platform: string
          priority: string | null
          recommendation_type: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          id?: string
          implementation_difficulty?: string | null
          lead_id: string
          metadata?: Json | null
          platform: string
          priority?: string | null
          recommendation_type: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          id?: string
          implementation_difficulty?: string | null
          lead_id?: string
          metadata?: Json | null
          platform?: string
          priority?: string | null
          recommendation_type?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_recommendations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          created_at: string
          feature_access_until: string | null
          granted_features: Json | null
          id: string
          language: string
          name: string
          role: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string
          feature_access_until?: string | null
          granted_features?: Json | null
          id: string
          language?: string
          name: string
          role?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string
          feature_access_until?: string | null
          granted_features?: Json | null
          id?: string
          language?: string
          name?: string
          role?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          id: string
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          granted_features: Json | null
          granted_role: string | null
          id: string
          is_review_code: boolean | null
          max_uses: number | null
          status: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          granted_features?: Json | null
          granted_role?: string | null
          id?: string
          is_review_code?: boolean | null
          max_uses?: number | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          granted_features?: Json | null
          granted_role?: string | null
          id?: string
          is_review_code?: boolean | null
          max_uses?: number | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
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
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          changed_fields: string[] | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          old_data: Json | null
          row_data: Json | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          old_data?: Json | null
          row_data?: Json | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          old_data?: Json | null
          row_data?: Json | null
          table_name?: string
          user_id?: string | null
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
            foreignKeyName: "fk_service_prices_package_id"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
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
      swot_analysis: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          id: string
          lead_id: string
          opportunities: string[] | null
          overall_score: number | null
          strengths: string[] | null
          threats: string[] | null
          updated_at: string | null
          weaknesses: string[] | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          lead_id: string
          opportunities?: string[] | null
          overall_score?: number | null
          strengths?: string[] | null
          threats?: string[] | null
          updated_at?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          lead_id?: string
          opportunities?: string[] | null
          overall_score?: number | null
          strengths?: string[] | null
          threats?: string[] | null
          updated_at?: string | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "swot_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      unclaimed_business_profiles: {
        Row: {
          address: string | null
          business_model: string[] | null
          business_name: string | null
          category_ids: string[] | null
          claim_status: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          competition_level: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          location: string | null
          market_analysis: Json
          matbakh_category: string | null
          monetization_tier: string
          notes: string | null
          opening_hours: string[] | null
          revenue_streams: string[] | null
          seating_capacity: number | null
          special_features: Json | null
          target_audience: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_model?: string[] | null
          business_name?: string | null
          category_ids?: string[] | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          competition_level?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          market_analysis?: Json
          matbakh_category?: string | null
          monetization_tier?: string
          notes?: string | null
          opening_hours?: string[] | null
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          special_features?: Json | null
          target_audience?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_model?: string[] | null
          business_name?: string | null
          category_ids?: string[] | null
          claim_status?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          competition_level?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          market_analysis?: Json
          matbakh_category?: string | null
          monetization_tier?: string
          notes?: string | null
          opening_hours?: string[] | null
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          special_features?: Json | null
          target_audience?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unclaimed_business_profiles_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unclaimed_business_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unclaimed_lead_fk"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent_tracking: {
        Row: {
          consent_given: boolean
          consent_method: string | null
          consent_timestamp: string | null
          consent_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          partner_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_given: boolean
          consent_method?: string | null
          consent_timestamp?: string | null
          consent_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          partner_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_method?: string | null
          consent_timestamp?: string | null
          consent_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          partner_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consent_partner_fk"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consent_tracking_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      visibility_check_actions: {
        Row: {
          created_at: string
          detected_at: string
          id: string
          is_critical: boolean
          is_done: boolean
          lead_id: string
          platform: string
          todo_text: string
          todo_type: string
          todo_why: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detected_at?: string
          id?: string
          is_critical?: boolean
          is_done?: boolean
          lead_id: string
          platform?: string
          todo_text: string
          todo_type: string
          todo_why: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detected_at?: string
          id?: string
          is_critical?: boolean
          is_done?: boolean
          lead_id?: string
          platform?: string
          todo_text?: string
          todo_type?: string
          todo_why?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visibility_check_actions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "visibility_check_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      visibility_check_leads: {
        Row: {
          analysis_completed_at: string | null
          analysis_data: Json | null
          analysis_error_message: string | null
          analysis_started_at: string | null
          analysis_status: string | null
          analyzed_at: string | null
          benchmarks: Json | null
          business_model: string[] | null
          business_name: string
          check_type: string
          competitor_urls: string[] | null
          confirm_expires_at: string | null
          confirm_token_hash: string | null
          created_at: string
          double_optin_confirmed: boolean | null
          double_optin_confirmed_at: string | null
          double_optin_sent_at: string | null
          email: string | null
          email_confirmed: boolean | null
          facebook_handle: string | null
          facebook_score: number | null
          found_business: boolean | null
          full_report_url: string | null
          gdpr_consent: boolean | null
          google_score: number | null
          id: string
          instagram_handle: string | null
          instagram_score: number | null
          ip_address: string | null
          language: string | null
          linkedin_handle: string | null
          locale: string | null
          location: string | null
          location_data: Json | null
          location_text: string | null
          main_category: string | null
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          matbakh_category: string | null
          migrated_to_profile: boolean | null
          opening_hours: Json | null
          overall_score: number | null
          phone_number: string | null
          postal_code: string | null
          report_generated_at: string | null
          report_sent_at: string | null
          report_url: string | null
          result_status: string
          revenue_streams: string[] | null
          seating_capacity: number | null
          social_links: Json | null
          special_features: Json | null
          status: string | null
          sub_category: string | null
          target_audience: string[] | null
          tiktok_handle: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          verification_token: string | null
          website: string | null
        }
        Insert: {
          analysis_completed_at?: string | null
          analysis_data?: Json | null
          analysis_error_message?: string | null
          analysis_started_at?: string | null
          analysis_status?: string | null
          analyzed_at?: string | null
          benchmarks?: Json | null
          business_model?: string[] | null
          business_name: string
          check_type?: string
          competitor_urls?: string[] | null
          confirm_expires_at?: string | null
          confirm_token_hash?: string | null
          created_at?: string
          double_optin_confirmed?: boolean | null
          double_optin_confirmed_at?: string | null
          double_optin_sent_at?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          facebook_handle?: string | null
          facebook_score?: number | null
          found_business?: boolean | null
          full_report_url?: string | null
          gdpr_consent?: boolean | null
          google_score?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_score?: number | null
          ip_address?: string | null
          language?: string | null
          linkedin_handle?: string | null
          locale?: string | null
          location?: string | null
          location_data?: Json | null
          location_text?: string | null
          main_category?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          matbakh_category?: string | null
          migrated_to_profile?: boolean | null
          opening_hours?: Json | null
          overall_score?: number | null
          phone_number?: string | null
          postal_code?: string | null
          report_generated_at?: string | null
          report_sent_at?: string | null
          report_url?: string | null
          result_status?: string
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          social_links?: Json | null
          special_features?: Json | null
          status?: string | null
          sub_category?: string | null
          target_audience?: string[] | null
          tiktok_handle?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_token?: string | null
          website?: string | null
        }
        Update: {
          analysis_completed_at?: string | null
          analysis_data?: Json | null
          analysis_error_message?: string | null
          analysis_started_at?: string | null
          analysis_status?: string | null
          analyzed_at?: string | null
          benchmarks?: Json | null
          business_model?: string[] | null
          business_name?: string
          check_type?: string
          competitor_urls?: string[] | null
          confirm_expires_at?: string | null
          confirm_token_hash?: string | null
          created_at?: string
          double_optin_confirmed?: boolean | null
          double_optin_confirmed_at?: string | null
          double_optin_sent_at?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          facebook_handle?: string | null
          facebook_score?: number | null
          found_business?: boolean | null
          full_report_url?: string | null
          gdpr_consent?: boolean | null
          google_score?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_score?: number | null
          ip_address?: string | null
          language?: string | null
          linkedin_handle?: string | null
          locale?: string | null
          location?: string | null
          location_data?: Json | null
          location_text?: string | null
          main_category?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          matbakh_category?: string | null
          migrated_to_profile?: boolean | null
          opening_hours?: Json | null
          overall_score?: number | null
          phone_number?: string | null
          postal_code?: string | null
          report_generated_at?: string | null
          report_sent_at?: string | null
          report_url?: string | null
          result_status?: string
          revenue_streams?: string[] | null
          seating_capacity?: number | null
          social_links?: Json | null
          special_features?: Json | null
          status?: string | null
          sub_category?: string | null
          target_audience?: string[] | null
          tiktok_handle?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_token?: string | null
          website?: string | null
        }
        Relationships: []
      }
      visibility_check_results: {
        Row: {
          analysis_duration_ms: number | null
          api_calls_made: Json | null
          business_profile_id: string
          category_scores: Json | null
          check_type: string | null
          competitive_analysis: Json | null
          created_at: string | null
          dashboard_widgets: Json | null
          data_sources_used: string[] | null
          id: string
          missing_elements: string[] | null
          overall_score: number | null
          pdf_export_data: Json | null
          recommendations: Json | null
          strengths: string[] | null
        }
        Insert: {
          analysis_duration_ms?: number | null
          api_calls_made?: Json | null
          business_profile_id: string
          category_scores?: Json | null
          check_type?: string | null
          competitive_analysis?: Json | null
          created_at?: string | null
          dashboard_widgets?: Json | null
          data_sources_used?: string[] | null
          id?: string
          missing_elements?: string[] | null
          overall_score?: number | null
          pdf_export_data?: Json | null
          recommendations?: Json | null
          strengths?: string[] | null
        }
        Update: {
          analysis_duration_ms?: number | null
          api_calls_made?: Json | null
          business_profile_id?: string
          category_scores?: Json | null
          check_type?: string | null
          competitive_analysis?: Json | null
          created_at?: string | null
          dashboard_widgets?: Json | null
          data_sources_used?: string[] | null
          id?: string
          missing_elements?: string[] | null
          overall_score?: number | null
          pdf_export_data?: Json | null
          recommendations?: Json | null
          strengths?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "visibility_check_results_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visibility_trends: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          trend_metrics: Json | null
          trends_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          trend_metrics?: Json | null
          trends_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          trend_metrics?: Json | null
          trends_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      gmb_categories_backup: {
        Row: {
          category_id: string | null
          category_path: string | null
          country_availability: string[] | null
          created_at: string | null
          description: string | null
          is_popular: boolean | null
          is_primary: boolean | null
          keywords: string[] | null
          name_de: string | null
          name_en: string | null
          parent_category_id: string | null
          sort_order: number | null
          synonyms: string[] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          category_path?: string | null
          country_availability?: string[] | null
          created_at?: string | null
          description?: string | null
          is_popular?: boolean | null
          is_primary?: boolean | null
          keywords?: string[] | null
          name_de?: string | null
          name_en?: string | null
          parent_category_id?: string | null
          sort_order?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          category_path?: string | null
          country_availability?: string[] | null
          created_at?: string | null
          description?: string | null
          is_popular?: boolean | null
          is_primary?: boolean | null
          keywords?: string[] | null
          name_de?: string | null
          name_en?: string | null
          parent_category_id?: string | null
          sort_order?: number | null
          synonyms?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      visibility_health_monitor: {
        Row: {
          analyzing_leads: number | null
          check_date: string | null
          completed_leads: number | null
          failed_leads: number | null
          missing_reports: number | null
          pending_leads: number | null
          reports_generated: number | null
          stale_pending: number | null
          total_leads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_security_alerts: {
        Args: { p_event_type: string; p_severity: string; p_user_id: string }
        Returns: undefined
      }
      cleanup_old_security_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_business_profile: {
        Args: { partner_id_param: string }
        Returns: {
          address: string
          business_name: string
          created_at: string
          google_place_id: string
          id: string
          last_updated: string
          opening_hours: Json
          partner_id: string
          phone: string
          photos: string[]
          rating: number
          review_count: number
          reviews: Json
          updated_at: string
          website: string
        }[]
      }
      get_visibility_score: {
        Args: { partner_id_param: string }
        Returns: {
          business_name: string
          freshness_score: number
          hours_score: number
          id: string
          last_updated: string
          partner_id: string
          photo_score: number
          rating: number
          rating_score: number
          review_count: number
          review_score: number
          visibility_score: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      process_pending_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_id: string
          alert_type: string
          created_at: string
          description: string
          severity: string
          title: string
        }[]
      }
      redeem_promo_code_transaction: {
        Args: {
          p_granted_features: Json
          p_granted_role: string
          p_promo_code_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      refresh_restaurant_match_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_security_alert: {
        Args: { p_alert_id: string; p_resolved_by?: string }
        Returns: boolean
      }
      validate_additional_kpis: {
        Args: { kpis: Json }
        Returns: boolean
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
