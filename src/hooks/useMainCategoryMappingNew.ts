import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MainCategory {
  id: string;       // UUID
  slug: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * UUID-based main category mapping hook for use after migration
 * This will replace useMainCategoryMapping once main_categories table exists
 */
export function useMainCategoryMappingNew() {
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use any type to bypass TypeScript checking until table exists
        const { data, error } = await (supabase as any)
          .from("main_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        
        if (!error && data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching main categories (table may not exist yet):", err);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  /** Returns UUID for a given slug */
  const uuidBySlug = (slug: string): string =>
    categories.find((c) => c.slug === slug)?.id ?? "";

  /** Maps array of slugs to UUID array */
  const uuidsBySlugs = (slugs: string[]): string[] =>
    slugs
      .map((slug) => uuidBySlug(slug))
      .filter((id): id is string => Boolean(id));

  /** Maps UUID to display name (DE/EN) */
  const nameById = (id: string, lang: "de" | "en" = "de"): string =>
    categories.find((c) => c.id === id)?.[lang === "de" ? "name_de" : "name_en"] ?? id;

  /** Get canonical name by slug (backward compatibility) */
  const getCanonicalNameBySlug = (slug: string): string => {
    const category = categories.find((c) => c.slug === slug);
    return category?.name_de ?? slug;
  };

  /** Convert slugs to IDs (backward compatibility) */
  const slugsToIds = (slugs: string[]): string[] => {
    return uuidsBySlugs(slugs);
  };

  return { 
    categories, 
    uuidBySlug, 
    uuidsBySlugs, 
    nameById, 
    getCanonicalNameBySlug,
    slugsToIds,
    loading 
  };
}