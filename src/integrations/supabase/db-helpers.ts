import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type Row<K extends keyof Tables>    = Tables[K]["Row"];
export type Insert<K extends keyof Tables> = Tables[K]["Insert"];
export type Update<K extends keyof Tables> = Tables[K]["Update"];