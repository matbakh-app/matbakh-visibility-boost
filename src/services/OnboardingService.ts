/**
 * AWS RDS OnboardingService
 *
 * @description Handles partner onboarding data storage in AWS RDS
 * @usage Partner onboarding wizard and profile management
 * @status PRODUCTION - AWS Native
 */

import { rdsClient } from "@/services/aws-rds-client";

export interface OnboardingAnswers {
  companyName: string;
  phone?: string;
  website?: string;
  address?: string;
  businessModel?: string[];
  revenueStreams?: string[];
  targetAudience?: string[];
  seatingCapacity?: number;
  openingHours?: Record<string, any>;
  specialFeatures?: string[];
  selectedServices?: string[];
  categories?: string[];
  kpiData?: Record<string, any>;
  googleConnected?: boolean;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class OnboardingService {
  /**
   * Complete partner onboarding process
   */
  static async completeOnboarding(
    userId: string,
    userEmail: string,
    answers: OnboardingAnswers
  ): Promise<ServiceResponse<any>> {
    try {
      // Start transaction
      return await rdsClient.transaction(async (client) => {
        // 1. Create or update business partner
        const partner = await client.queryOne(
          `INSERT INTO business_partners (
            user_id, company_name, contact_email, contact_phone, website,
            business_model, revenue_streams, target_audience, seating_capacity,
            opening_hours, special_features, services_selected, onboarding_completed,
            status, category_ids, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            company_name = EXCLUDED.company_name,
            contact_phone = EXCLUDED.contact_phone,
            website = EXCLUDED.website,
            business_model = EXCLUDED.business_model,
            revenue_streams = EXCLUDED.revenue_streams,
            target_audience = EXCLUDED.target_audience,
            seating_capacity = EXCLUDED.seating_capacity,
            opening_hours = EXCLUDED.opening_hours,
            special_features = EXCLUDED.special_features,
            services_selected = EXCLUDED.services_selected,
            onboarding_completed = EXCLUDED.onboarding_completed,
            status = EXCLUDED.status,
            category_ids = EXCLUDED.category_ids,
            updated_at = NOW()
          RETURNING *`,
          [
            userId,
            answers.companyName,
            userEmail,
            answers.phone || null,
            answers.website || null,
            JSON.stringify(answers.businessModel || []),
            JSON.stringify(answers.revenueStreams || []),
            JSON.stringify(answers.targetAudience || []),
            answers.seatingCapacity || null,
            JSON.stringify(answers.openingHours || {}),
            JSON.stringify(answers.specialFeatures || []),
            JSON.stringify(answers.selectedServices || []),
            true,
            "active",
            JSON.stringify(answers.categories || []),
          ]
        );

        if (!partner) {
          throw new Error("Failed to create business partner");
        }

        // 2. Create or update business profile
        await client.query(
          `INSERT INTO business_profiles (
            user_id, company_name, address, phone, website, google_connected,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            company_name = EXCLUDED.company_name,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            google_connected = EXCLUDED.google_connected,
            updated_at = NOW()`,
          [
            userId,
            answers.companyName,
            answers.address || null,
            answers.phone || null,
            answers.website || null,
            answers.googleConnected || false,
          ]
        );

        // 3. Save KPI data if provided
        if (answers.kpiData && Object.keys(answers.kpiData).length > 0) {
          await client.query(
            `INSERT INTO partner_kpis (
              partner_id, monthly_revenue, customer_count, avg_order_value,
              conversion_rate, customer_satisfaction, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (partner_id)
            DO UPDATE SET
              monthly_revenue = EXCLUDED.monthly_revenue,
              customer_count = EXCLUDED.customer_count,
              avg_order_value = EXCLUDED.avg_order_value,
              conversion_rate = EXCLUDED.conversion_rate,
              customer_satisfaction = EXCLUDED.customer_satisfaction,
              updated_at = NOW()`,
            [
              partner.id,
              answers.kpiData.monthlyRevenue || null,
              answers.kpiData.customerCount || null,
              answers.kpiData.avgOrderValue || null,
              answers.kpiData.conversionRate || null,
              answers.kpiData.customerSatisfaction || null,
            ]
          );
        }

        // 4. Save onboarding steps
        const onboardingSteps = [
          {
            step_name: "google_connection",
            data: { connected: answers.googleConnected },
            completed: !!answers.googleConnected,
          },
          {
            step_name: "business_basics",
            data: answers,
            completed: true,
          },
          {
            step_name: "service_selection",
            data: { services: answers.selectedServices },
            completed: true,
          },
          {
            step_name: "kpi_input",
            data: answers.kpiData,
            completed: !!answers.kpiData,
          },
        ];

        for (const step of onboardingSteps) {
          await client.query(
            `INSERT INTO partner_onboarding_steps (
              partner_id, step_name, data, completed, completed_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (partner_id, step_name)
            DO UPDATE SET
              data = EXCLUDED.data,
              completed = EXCLUDED.completed,
              completed_at = EXCLUDED.completed_at,
              updated_at = NOW()`,
            [
              partner.id,
              step.step_name,
              JSON.stringify(step.data),
              step.completed,
              step.completed ? new Date().toISOString() : null,
            ]
          );
        }

        return {
          success: true,
          data: partner,
          message: "Onboarding erfolgreich abgeschlossen",
        };
      });
    } catch (error) {
      console.error("OnboardingService: Error completing onboarding:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Fehler beim Abschließen des Onboardings",
      };
    }
  }

  /**
   * Get onboarding progress for a user
   */
  static async getOnboardingProgress(
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      const partner = await rdsClient.queryOne(
        "SELECT * FROM business_partners WHERE user_id = $1",
        [userId]
      );

      if (!partner) {
        return {
          success: false,
          message: "Kein Partner-Profil gefunden",
        };
      }

      const steps = await rdsClient.query(
        "SELECT * FROM partner_onboarding_steps WHERE partner_id = $1 ORDER BY created_at",
        [partner.id]
      );

      return {
        success: true,
        data: {
          partner,
          steps,
          completed: partner.onboarding_completed,
        },
      };
    } catch (error) {
      console.error("OnboardingService: Error getting progress:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Fehler beim Laden des Onboarding-Fortschritts",
      };
    }
  }

  /**
   * Test AWS RDS connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      return await rdsClient.testConnection();
    } catch (error) {
      console.error("OnboardingService: Connection test failed:", error);
      return false;
    }
  }
}
