// MIGRATED: Database types moved to AWS RDS schema
// This file is deprecated - use AWS RDS types instead

export type Tables = Database["public"]["Tables"];
export type Row<K extends keyof Tables>    = Tables[K]["Row"];
export type Insert<K extends keyof Tables> = Tables[K]["Insert"];
export type Update<K extends keyof Tables> = Tables[K]["Update"];