import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist", 
      "src/archive/**/manual-archive/**",
      "src/archive/**/src/**",
      "src/archive/backup-files/**",
      "src/archive/legacy-auth/**",
      "src/archive/figma-demos/**",
      "src/archive/old-flows/**",
      "src/archive/old-profile-flow/**"
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
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
      "@typescript-eslint/no-unused-vars": "off",
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
          ]
        }
      ],
    },
  }
);
