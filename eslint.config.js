import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  {
    ignores: [
      "dist",
      "src/archive/**/manual-archive/**",
      "src/archive/**/src/**",
      "src/archive/backup-files/**",
      "src/archive/legacy-auth/**",
      "src/archive/figma-demos/**",
      "src/archive/old-flows/**",
      "src/archive/old-profile-flow/**",
      "test-legacy.js", // Ignore test files
      "eslint-rules/**" // Ignore custom rules directory
    ]
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-unused-vars": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/archive/*/manual-archive/*",
                "@/archive/*/src/*",
                "src/archive/*/manual-archive/*",
                "src/archive/*/src/*",
                "../archive/*/manual-archive/*",
                "../archive/*/src/*",
                "./archive/*/manual-archive/*",
                "./archive/*/src/*",
                "@/archive/backup-files/*",
                "@/archive/legacy-auth/*",
                "@/archive/figma-demos/*",
                "@/archive/old-flows/*",
                "@/archive/old-profile-flow/*"
              ],
              message: "❌ Permanent archivierte Komponenten nicht importieren! Für on-hold Komponenten: Erst aus on-hold/ zurück nach src/ verschieben."
            }
          ],
          paths: [
            // Supabase legacy imports
            {
              name: "@supabase/supabase-js",
              message: "❌ Supabase ist deprecated! Verwende AWS RDS + Cognito stattdessen."
            },
            {
              name: "@supabase/auth-helpers-react",
              message: "❌ Supabase Auth ist deprecated! Verwende AWS Cognito stattdessen."
            },
            {
              name: "@supabase/auth-helpers-nextjs",
              message: "❌ Supabase Auth ist deprecated! Verwende AWS Cognito stattdessen."
            },
            // Vercel legacy imports
            {
              name: "@vercel/analytics",
              message: "❌ Vercel Analytics ist deprecated! Verwende AWS CloudWatch stattdessen."
            },
            {
              name: "@vercel/speed-insights",
              message: "❌ Vercel Speed Insights ist deprecated! Verwende AWS CloudWatch stattdessen."
            },
            // Twilio legacy imports
            {
              name: "twilio",
              message: "❌ Twilio ist deprecated! Verwende AWS SES für E-Mails oder AWS SNS für SMS."
            },
            // Resend legacy imports
            {
              name: "resend",
              message: "❌ Resend ist deprecated! Verwende AWS SES stattdessen."
            },
            // Lovable legacy imports
            {
              name: "lovable",
              message: "❌ Lovable Platform ist deprecated! Verwende AWS-native Services."
            }
          ]
        }
      ]
    },
  }
];