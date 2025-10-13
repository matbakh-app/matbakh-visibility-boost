import { useEffect, useState } from "react";
// MIGRATED: Supabase removed - use AWS services
// MIGRATED: Use AWS Cognito user types instead

interface FeatureAccess {
  features: string[];
  role: string;
  accessUntil?: Date;
  isExpired: boolean;
  subscriptionStatus: string;
}

export function useFeatureAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<FeatureAccess>({
    features: [],
    role: "user",
    isExpired: false,
    subscriptionStatus: "free",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFeatureAccess = async () => {
      try {
        // Get current user from AWS Cognito
        const currentUser = await Auth.currentAuthenticatedUser();
        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Get user profile with granted features via AWS API
        const response = await fetch("/api/user-profile", {
          headers: {
            Authorization: `Bearer ${(await Auth.currentSession())
              .getIdToken()
              .getJwtToken()}`,
          },
        });

        if (!response.ok) {
          console.warn("Profile fetch error:", response.statusText);
          setLoading(false);
          return;
        }

        const profile = await response.json();

        if (error) {
          console.warn("Profile fetch error:", error);
          setLoading(false);
          return;
        }

        if (profile) {
          const accessUntil = (profile as any).feature_access_until
            ? new Date((profile as any).feature_access_until)
            : undefined;

          const isExpired = accessUntil ? new Date() > accessUntil : false;

          setAccess({
            features: Array.isArray((profile as any).granted_features)
              ? (profile as any).granted_features.filter(
                  (item: any): item is string => typeof item === "string"
                )
              : [],
            role: (profile as any).role || "user",
            accessUntil,
            isExpired,
            subscriptionStatus: (profile as any).subscription_status || "free",
          });
        }
      } catch (error) {
        console.error("Error fetching feature access:", error);
      } finally {
        setLoading(false);
      }
    };

    getFeatureAccess();

    // Listen for auth changes with AWS Cognito
    const unsubscribe = Auth.Hub.listen(
      "auth",
      ({ payload: { event, data } }) => {
        if (event === "signIn" || event === "tokenRefresh") {
          getFeatureAccess();
        } else if (event === "signOut") {
          setUser(null);
          setAccess({
            features: [],
            role: "user",
            isExpired: false,
            subscriptionStatus: "free",
          });
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const hasFeature = (feature: string): boolean => {
    // Admin has all features
    if (access.role === "admin") return true;

    // Business partner has certain features by role
    if (
      access.role === "business_partner" &&
      ["business_analytics", "premium_features", "export_reports"].includes(
        feature
      )
    ) {
      return true;
    }

    // Check granted features (not expired)
    if (access.features.includes(feature) && !access.isExpired) {
      return true;
    }

    return false;
  };

  const hasAnyFeature = (requiredFeatures: string[]): boolean => {
    return requiredFeatures.some((feature) => hasFeature(feature));
  };

  const hasRole = (requiredRole: string): boolean => {
    if (requiredRole === "user") return true; // Everyone has user role minimum
    if (requiredRole === "business_partner")
      return ["business_partner", "admin"].includes(access.role);
    if (requiredRole === "admin") return access.role === "admin";
    return false;
  };

  return {
    user,
    access,
    loading,
    hasFeature,
    hasAnyFeature,
    hasRole,
    // Convenience getters
    isAdmin: access.role === "admin",
    isBusinessPartner: access.role === "business_partner",
    isPremium: access.subscriptionStatus !== "free",
    hasValidAccess: !access.isExpired,
  };
}
