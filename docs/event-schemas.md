# Event Schemas - matbakh.app Data Platform

## JSON Schema Definitions für Facts & Dimensions

### Fact Tables Event Schemas

#### fact_onboarding_steps
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Onboarding Step Event",
  "type": "object",
  "required": ["event_id", "user_id", "step_id", "event_type", "timestamp", "date_key"],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique event identifier (UUIDv7)"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "User identifier"
    },
    "account_id": {
      "type": ["string", "null"],
      "format": "uuid",
      "description": "Business account identifier"
    },
    "step_id": {
      "type": "string",
      "maxLength": 50,
      "enum": ["persona_questions", "business_data", "email_consent", "doi_confirm", "vc_start", "gbp_connect", "ga4_connect", "photos_upload", "categories_refine", "social_connect"],
      "description": "Onboarding step identifier"
    },
    "event_type": {
      "type": "string",
      "enum": ["started", "completed", "skipped", "abandoned"],
      "description": "Type of step event"
    },
    "persona": {
      "type": ["string", "null"],
      "enum": ["solo-sarah", "bewahrer-ben", "wachstums-walter", "ketten-katrin"],
      "description": "Assigned persona"
    },
    "comm_prefs": {
      "type": ["object", "null"],
      "properties": {
        "address": {"type": "string", "enum": ["sie", "du", "neutral"]},
        "tone": {"type": "string", "enum": ["encouraging", "facts", "brief"]},
        "help": {"type": "string", "enum": ["fast", "standard", "simple"]},
        "language": {"type": "string", "enum": ["de", "en"]}
      },
      "description": "Communication preferences at time of event"
    },
    "duration_seconds": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 3600,
      "description": "Time spent on step in seconds"
    },
    "copy_variant": {
      "type": ["string", "null"],
      "maxLength": 50,
      "description": "Copy variant shown to user"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Event timestamp (ISO 8601)"
    },
    "date_key": {
      "type": "integer",
      "minimum": 20250101,
      "maximum": 20991231,
      "description": "Date key in YYYYMMDD format"
    },
    "external_ids": {
      "type": ["object", "null"],
      "properties": {
        "gbp_place_id": {"type": "string"},
        "ga4_client_id": {"type": "string"},
        "fb_page_id": {"type": "string"}
      },
      "description": "External system identifiers"
    }
  }
}
```

#### fact_visibility_check
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Visibility Check Event",
  "type": "object",
  "required": ["check_id", "user_id", "account_id", "overall_score", "timestamp", "date_key"],
  "properties": {
    "check_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique visibility check identifier"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "User identifier"
    },
    "account_id": {
      "type": "string",
      "format": "uuid",
      "description": "Business account identifier"
    },
    "location_id": {
      "type": ["string", "null"],
      "format": "uuid",
      "description": "Location identifier"
    },
    "overall_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Overall visibility score (0-100)"
    },
    "gbp_score": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 100,
      "description": "Google Business Profile score"
    },
    "social_score": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 100,
      "description": "Social media presence score"
    },
    "web_score": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 100,
      "description": "Website/SEO score"
    },
    "competitor_count": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 50,
      "description": "Number of competitors analyzed"
    },
    "processing_time_seconds": {
      "type": ["integer", "null"],
      "minimum": 1,
      "maximum": 300,
      "description": "Time taken to complete check"
    },
    "data_sources": {
      "type": ["array", "null"],
      "items": {
        "type": "string",
        "enum": ["gbp", "ga4", "facebook", "instagram", "website"]
      },
      "description": "Data sources used in check"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Check completion timestamp"
    },
    "date_key": {
      "type": "integer",
      "minimum": 20250101,
      "maximum": 20991231,
      "description": "Date key in YYYYMMDD format"
    }
  }
}
```

#### fact_email_events
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Email Event",
  "type": "object",
  "required": ["event_id", "email_lower", "event_type", "timestamp", "date_key"],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique email event identifier"
    },
    "user_id": {
      "type": ["string", "null"],
      "format": "uuid",
      "description": "User identifier (if known)"
    },
    "email_lower": {
      "type": "string",
      "format": "email",
      "maxLength": 255,
      "description": "Lowercase email address"
    },
    "campaign_id": {
      "type": ["string", "null"],
      "maxLength": 100,
      "enum": ["doi_confirmation", "onb_day1_gbp", "onb_day2_ga4", "onb_day3_photos", "onb_weekly_summary"],
      "description": "Email campaign identifier"
    },
    "event_type": {
      "type": "string",
      "enum": ["sent", "delivered", "open", "click", "bounce", "complaint", "unsubscribe"],
      "description": "Type of email event"
    },
    "copy_variant": {
      "type": ["string", "null"],
      "maxLength": 50,
      "enum": ["encouraging_sie", "encouraging_du", "facts_sie", "facts_du", "brief_sie", "brief_du"],
      "description": "Copy variant used in email"
    },
    "subject_variant": {
      "type": ["string", "null"],
      "maxLength": 50,
      "enum": ["encouraging", "factual"],
      "description": "Subject line variant"
    },
    "bounce_type": {
      "type": ["string", "null"],
      "enum": ["hard", "soft", "complaint"],
      "description": "Type of bounce (if applicable)"
    },
    "click_url": {
      "type": ["string", "null"],
      "format": "uri",
      "description": "Clicked URL (for click events)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Event timestamp"
    },
    "date_key": {
      "type": "integer",
      "minimum": 20250101,
      "maximum": 20991231,
      "description": "Date key in YYYYMMDD format"
    }
  }
}
```

#### fact_login_oauth
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OAuth Login Event",
  "type": "object",
  "required": ["event_id", "provider", "success", "timestamp", "date_key"],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique login event identifier"
    },
    "user_id": {
      "type": ["string", "null"],
      "format": "uuid",
      "description": "User identifier (if login successful)"
    },
    "provider": {
      "type": "string",
      "enum": ["google", "facebook", "email"],
      "description": "OAuth provider"
    },
    "success": {
      "type": "boolean",
      "description": "Whether login was successful"
    },
    "error_code": {
      "type": ["string", "null"],
      "maxLength": 50,
      "enum": ["access_denied", "invalid_request", "server_error", "temporarily_unavailable"],
      "description": "OAuth error code (if failed)"
    },
    "ip_address": {
      "type": ["string", "null"],
      "format": "ipv4",
      "description": "Client IP address (hashed for privacy)"
    },
    "user_agent": {
      "type": ["string", "null"],
      "maxLength": 500,
      "description": "Client user agent (truncated)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Login attempt timestamp"
    },
    "date_key": {
      "type": "integer",
      "minimum": 20250101,
      "maximum": 20991231,
      "description": "Date key in YYYYMMDD format"
    }
  }
}
```

### Dimension Tables Schemas

#### dim_user
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Dimension",
  "type": "object",
  "required": ["user_id", "signup_date", "is_active"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "Primary user identifier"
    },
    "email_hash": {
      "type": ["string", "null"],
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 hash of email for analytics"
    },
    "signup_date": {
      "type": "string",
      "format": "date",
      "description": "User registration date"
    },
    "persona": {
      "type": ["string", "null"],
      "enum": ["solo-sarah", "bewahrer-ben", "wachstums-walter", "ketten-katrin"],
      "description": "Current assigned persona"
    },
    "communication_prefs": {
      "type": ["object", "null"],
      "properties": {
        "address": {"type": "string", "enum": ["sie", "du", "neutral"]},
        "tone": {"type": "string", "enum": ["encouraging", "facts", "brief"]},
        "help": {"type": "string", "enum": ["fast", "standard", "simple"]},
        "language": {"type": "string", "enum": ["de", "en"]},
        "fontScale": {"type": "number", "enum": [1, 1.2]},
        "tooltips": {"type": "boolean"}
      },
      "description": "User communication preferences"
    },
    "is_active": {
      "type": "boolean",
      "description": "Whether user account is active"
    },
    "last_login": {
      "type": ["string", "null"],
      "format": "date-time",
      "description": "Last login timestamp"
    },
    "consent_status": {
      "type": ["object", "null"],
      "properties": {
        "email_verified": {"type": "boolean"},
        "marketing_consent": {"type": "boolean"},
        "analytics_consent": {"type": "boolean"},
        "last_updated": {"type": "string", "format": "date-time"}
      },
      "description": "Current consent status"
    }
  }
}
```

#### dim_account
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Account Dimension",
  "type": "object",
  "required": ["account_id", "business_name", "created_date", "is_active"],
  "properties": {
    "account_id": {
      "type": "string",
      "format": "uuid",
      "description": "Primary account identifier"
    },
    "business_name": {
      "type": "string",
      "maxLength": 255,
      "description": "Business name"
    },
    "main_category": {
      "type": ["string", "null"],
      "maxLength": 100,
      "description": "Primary business category"
    },
    "price_range": {
      "type": ["string", "null"],
      "enum": ["budget", "moderate", "upscale", "luxury"],
      "description": "Price range category"
    },
    "additional_services": {
      "type": ["array", "null"],
      "items": {
        "type": "string",
        "enum": ["delivery", "catering", "takeaway", "breakfast", "lunch", "bar", "terrace", "family", "business", "events"]
      },
      "description": "Additional services offered"
    },
    "created_date": {
      "type": "string",
      "format": "date",
      "description": "Account creation date"
    },
    "is_active": {
      "type": "boolean",
      "description": "Whether account is active"
    }
  }
}
```

#### dim_location
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Location Dimension",
  "type": "object",
  "required": ["location_id", "account_id", "city", "country"],
  "properties": {
    "location_id": {
      "type": "string",
      "format": "uuid",
      "description": "Primary location identifier"
    },
    "account_id": {
      "type": "string",
      "format": "uuid",
      "description": "Parent account identifier"
    },
    "address": {
      "type": ["string", "null"],
      "maxLength": 500,
      "description": "Full address"
    },
    "city": {
      "type": "string",
      "maxLength": 100,
      "description": "City name"
    },
    "country": {
      "type": "string",
      "maxLength": 50,
      "description": "Country name"
    },
    "gbp_place_id": {
      "type": ["string", "null"],
      "maxLength": 255,
      "description": "Google Business Profile place ID"
    },
    "latitude": {
      "type": ["number", "null"],
      "minimum": -90,
      "maximum": 90,
      "description": "Latitude coordinate"
    },
    "longitude": {
      "type": ["number", "null"],
      "minimum": -180,
      "maximum": 180,
      "description": "Longitude coordinate"
    }
  }
}
```

### Communication Events Schema

#### prefs_set Event
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Communication Preferences Set Event",
  "type": "object",
  "required": ["event_id", "user_id", "timestamp"],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid"
    },
    "user_id": {
      "type": "string",
      "format": "uuid"
    },
    "tone": {
      "type": "string",
      "enum": ["encouraging", "facts", "brief"]
    },
    "address": {
      "type": "string",
      "enum": ["sie", "du", "neutral"]
    },
    "help_level": {
      "type": "string",
      "enum": ["fast", "standard", "simple"]
    },
    "language": {
      "type": "string",
      "enum": ["de", "en"]
    },
    "accessibility": {
      "type": "object",
      "properties": {
        "fontScale": {"type": "number", "enum": [1, 1.2]},
        "tooltips": {"type": "boolean"}
      }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

#### copy_variant_served Event
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Copy Variant Served Event",
  "type": "object",
  "required": ["event_id", "user_id", "view_id", "variant_id", "timestamp"],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid"
    },
    "user_id": {
      "type": "string",
      "format": "uuid"
    },
    "view_id": {
      "type": "string",
      "maxLength": 50,
      "description": "UI view/screen identifier"
    },
    "variant_id": {
      "type": "string",
      "maxLength": 50,
      "description": "Copy variant identifier"
    },
    "context": {
      "type": "object",
      "properties": {
        "persona": {"type": "string"},
        "onb_day": {"type": "integer"},
        "step_id": {"type": "string"}
      }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### Validation Rules

#### Common Patterns
```json
{
  "uuid_v7": "^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
  "email_lower": "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
  "date_key": "^(20[2-9][0-9])(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$",
  "sha256_hash": "^[a-f0-9]{64}$"
}
```

#### Data Quality Constraints
```json
{
  "required_fields": {
    "all_events": ["event_id", "timestamp", "date_key"],
    "user_events": ["user_id"],
    "email_events": ["email_lower"]
  },
  "value_ranges": {
    "scores": {"min": 0, "max": 100},
    "duration_seconds": {"min": 0, "max": 3600},
    "date_key": {"min": 20250101, "max": 20991231}
  },
  "enum_validation": {
    "personas": ["solo-sarah", "bewahrer-ben", "wachstums-walter", "ketten-katrin"],
    "event_types": ["started", "completed", "skipped", "abandoned"],
    "email_events": ["sent", "delivered", "open", "click", "bounce", "complaint", "unsubscribe"]
  }
}
```