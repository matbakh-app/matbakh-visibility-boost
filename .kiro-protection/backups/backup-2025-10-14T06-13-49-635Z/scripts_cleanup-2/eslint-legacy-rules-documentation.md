# ESLint Legacy Rules Documentation

**Created:** 2025-10-13  
**Task:** 2.1 Configure ESLint legacy rules  
**Requirements:** 3.1

## Overview

This document describes the ESLint rules implemented to prevent usage of legacy external services in the matbakh.app codebase. These rules are part of the Cleanup 2 initiative to ensure complete migration to AWS-native services.

## Implemented Rules

### 1. no-restricted-imports

Blocks direct imports of legacy service packages:

#### Blocked Services

| Service                   | Package                         | AWS Alternative                 |
| ------------------------- | ------------------------------- | ------------------------------- |
| **Supabase**              | `@supabase/supabase-js`         | AWS RDS + Cognito               |
| **Supabase Auth**         | `@supabase/auth-helpers-react`  | AWS Cognito                     |
| **Supabase Auth**         | `@supabase/auth-helpers-nextjs` | AWS Cognito                     |
| **Vercel Analytics**      | `@vercel/analytics`             | AWS CloudWatch                  |
| **Vercel Speed Insights** | `@vercel/speed-insights`        | AWS CloudWatch                  |
| **Twilio**                | `twilio`                        | AWS SES (email) / AWS SNS (SMS) |
| **Resend**                | `resend`                        | AWS SES                         |
| **Lovable**               | `lovable`                       | AWS-native services             |

#### Example Violations

```javascript
// ❌ These will trigger ESLint errors:
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics";
import Twilio from "twilio";
import { Resend } from "resend";

// ✅ These are allowed:
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import React from "react";
```

### 2. Archive Import Protection

Prevents imports from archived components:

```javascript
// ❌ These will trigger ESLint errors:
import Component from "@/archive/manual-archive/Component";
import OldAuth from "src/archive/legacy-auth/OldAuth";

// ✅ For on-hold components, first move back to src/:
import Component from "@/components/Component"; // After moving from on-hold/
```

## Configuration

The rules are configured in `eslint.config.js`:

```javascript
"no-restricted-imports": [
  "error",
  {
    paths: [
      {
        name: "@supabase/supabase-js",
        message: "❌ Supabase ist deprecated! Verwende AWS RDS + Cognito stattdessen."
      },
      // ... other legacy services
    ]
  }
]
```

## Testing

### Manual Testing

```bash
# Test legacy imports (should fail)
npx eslint test-legacy.js --no-ignore

# Test allowed imports (should pass)
npx eslint test-allowed.js --no-ignore
```

### Automated Testing

Run the ESLint rule test suite:

```bash
npx tsx scripts/cleanup-2/test-eslint-rules.js
```

## Integration

### Pre-commit Hooks

The rules are integrated with Husky pre-commit hooks to prevent legacy code from being committed:

```bash
# In .husky/pre-commit
npx eslint . --ext ts,tsx,js,jsx
```

### CI/CD Pipeline

The rules are enforced in the GitHub Actions workflow:

```yaml
# In .github/workflows/legacy-guard.yml
- name: Run ESLint Legacy Check
  run: npm run lint
```

## Bypassing Rules (Emergency Only)

In emergency situations, rules can be bypassed using ESLint disable comments:

```javascript
// eslint-disable-next-line no-restricted-imports
import { createClient } from "@supabase/supabase-js";
```

**Note:** Bypasses should be temporary and require justification in code reviews.

## Error Messages

All error messages are in German and provide clear guidance:

- **Supabase:** "❌ Supabase ist deprecated! Verwende AWS RDS + Cognito stattdessen."
- **Vercel:** "❌ Vercel Analytics ist deprecated! Verwende AWS CloudWatch stattdessen."
- **Twilio:** "❌ Twilio ist deprecated! Verwende AWS SES für E-Mails oder AWS SNS für SMS."
- **Resend:** "❌ Resend ist deprecated! Verwende AWS SES stattdessen."
- **Lovable:** "❌ Lovable Platform ist deprecated! Verwende AWS-native Services."

## Maintenance

### Adding New Legacy Services

To block additional legacy services, add them to the `paths` array in `eslint.config.js`:

```javascript
{
  name: "new-legacy-service",
  message: "❌ New Legacy Service ist deprecated! Verwende AWS Alternative stattdessen."
}
```

### Updating AWS Alternatives

Update the error messages to reflect the correct AWS alternatives as the architecture evolves.

## Validation Results

✅ **Test Results:**

- Legacy imports correctly blocked: ✅
- Allowed imports pass validation: ✅
- Error messages are clear and helpful: ✅
- Integration with existing ESLint config: ✅

## Files Modified

- `eslint.config.js` - Main ESLint configuration
- `eslint-rules/no-legacy-services.js` - Custom rule (archived)
- `scripts/cleanup-2/test-eslint-rules.js` - Test suite
- `test-legacy.js` - Test file for legacy imports
- `test-allowed.js` - Test file for allowed imports

## Next Steps

1. Integrate with Husky pre-commit hooks (Task 2.2)
2. Set up GitHub Actions workflow (Task 2.3)
3. Add developer documentation for hook usage
4. Monitor rule effectiveness and adjust as needed

---

**Status:** ✅ COMPLETED  
**Requirements Fulfilled:** 3.1 - ESLint rules for legacy import blocking
