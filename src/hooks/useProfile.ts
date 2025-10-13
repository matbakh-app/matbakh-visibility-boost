import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
// MIGRATED: Supabase removed - use AWS services

interface UserProfile {
  id: string;
  name?: string;
  language?: string;
  role?: string;
  private_email?: string;
  phone?: string;
  address?: string;
  allergies?: string[];
  granted_features?: any;
  feature_access_until?: string;
  subscription_status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/user-profile", {
          headers: {
            Authorization: `Bearer ${(await Auth.currentSession())
              .getIdToken()
              .getJwtToken()}`,
          },
        });

        if (!response.ok) {
          console.error("Error loading profile:", response.statusText);
          setIsError(true);
        } else {
          const data = await response.json();
          setData(data as any);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const save = async (updates: Partial<UserProfile>) => {
    if (!user) return false;

    setIsLoading(true);
    setIsError(false);

    const response = await fetch("/api/user-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error("Error saving profile:", response.statusText);
      setIsError(true);
      setIsLoading(false);
      return false;
    }

    // Refresh data after save
    const updatedData = await response.json();

    if (updatedData) {
      setData(updatedData as any);
    }

    setIsLoading(false);
    return true;
  };

  return { data, isLoading, isError, save };
}
