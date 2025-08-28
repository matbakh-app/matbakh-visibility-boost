export type UIMode = "standard" | "invisible" | "system";

export type TonePreferences = {
  formality: "neutral" | "casual" | "professional";
  empathy: "low" | "medium" | "high";
  directness: "low" | "medium" | "high";
  brevity: "short" | "medium" | "long";
};

export type AudienceProfile = {
  gender_pref: "unspecified" | "female" | "male";
  time_pressure: "low" | "medium" | "high";
};

export type StylePreferences = {
  tone_preferences: TonePreferences;
  audience_profile: AudienceProfile;
};