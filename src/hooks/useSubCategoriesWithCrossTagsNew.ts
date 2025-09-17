import { useEffect, useState } from "react";
// MIGRATED: Supabase removed - use AWS services
import { Row, Insert } from "@/integrations/supabase/db-helpers";

export interface RelatedCategory {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  mainCategoryId: string;           // UUID
  mainCategoryName?: string;        // Display name
  crossTagIds?: string[];           // Array of related UUIDs
  confidence: "high" | "medium" | "low";
}

/**
 * UUID-based subcategory hook for use after migration
 * Queries subcategories using main_category_id UUIDs and cross-tag relations
 */
export const useSubCategoriesWithCrossTagsNew = (
  selectedMainCategoryUUIDs: string[],
  language: "de" | "en" = "de"
) => {
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMainCategoryUUIDs.length) {
      setAllSubCategories([]);
      return;
    }

    setLoading(true);

    const fetchSubCategories = async () => {
      try {
        // Get subcategories with direct main_category_id match
        const { data: directMatch, error: directError } = await supabase
          .from("gmb_categories")
          .select("*")
          .in("main_category_id", selectedMainCategoryUUIDs as any)
          .returns<Row<"gmb_categories">[]>();

        // Get subcategories through cross-tag relations
        const { data: crossTagged, error: crossError } = await supabase
          .from("gmb_categories")
          .select(`
            *,
            category_cross_tags (
              target_main_category_id,
              confidence_score,
              source
            )
          `)
          .not("category_cross_tags", "is", null)
          .returns<any[]>();

        // Filter cross-tagged subcategories by selected main UUIDs
        const crossFiltered = (crossTagged || []).filter((cat: any) =>
          cat.category_cross_tags?.some((ct: any) =>
            selectedMainCategoryUUIDs.includes(ct.target_main_category_id)
          )
        );

        // Map to RelatedCategory interface
        const mapCategory = (cat: any, isCrossTagged = false): RelatedCategory => ({
          id: cat.id,
          name: language === "de" ? cat.name_de : cat.name_en,
          description: language === "de" ? cat.description_de : cat.description_en,
          keywords: cat.keywords || [],
          mainCategoryId: cat.main_category_id,
          mainCategoryName: language === "de" ? cat.haupt_kategorie : cat.main_category,
          crossTagIds: isCrossTagged 
            ? cat.category_cross_tags?.map((ct: any) => ct.target_main_category_id) ?? []
            : [],
          confidence: cat.is_popular 
            ? "high" 
            : isCrossTagged 
              ? "medium" 
              : "low"
        });

        // Combine and deduplicate results
        const combined: RelatedCategory[] = [
          ...(directMatch || []).map((cat: any) => mapCategory(cat, false)),
          ...crossFiltered.map((cat: any) => mapCategory(cat, true))
        ];

        // Remove duplicates based on ID
        const deduplicated = Array.from(
          new Map(combined.map((cat) => [cat.id, cat])).values()
        );

        setAllSubCategories(deduplicated);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setAllSubCategories([]);
      }
      
      setLoading(false);
    };

    fetchSubCategories();
  }, [selectedMainCategoryUUIDs, language]);

  /**
   * Filter categories by search term
   */
  const filterCategories = (searchTerm: string, excludeIds: string[] = []): RelatedCategory[] => {
    if (!searchTerm.trim()) {
      return allSubCategories.filter(cat => !excludeIds.includes(cat.id));
    }

    const searchLower = searchTerm.toLowerCase();
    return allSubCategories.filter(cat => {
      if (excludeIds.includes(cat.id)) return false;
      
      return (
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower) ||
        cat.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    });
  };

  /**
   * Log search activity for analytics
   */
  const logSearch = async (
    searchTerm: string, 
    resultCategoryIds: string[], 
    selectedCategoryId?: string
  ) => {
    try {
      type InsertSearchLog = Insert<"category_search_logs">;
      
      const payload: InsertSearchLog = {
        search_term: searchTerm,
        selected_main_categories: selectedMainCategoryUUIDs,
        result_category_ids: resultCategoryIds,
        selected_category_id: selectedCategoryId ?? null,
        user_id: null
      };
      
      await supabase.from("category_search_logs").insert([payload]);
    } catch (err) {
      console.error("Error logging search:", err);
    }
  };

  return { 
    allSubCategories, 
    loading, 
    filterCategories, 
    logSearch 
  };
};