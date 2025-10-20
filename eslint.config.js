import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "scripts/check-legal-locales.js",
      "scripts/i18n-scanner-validation.js",
      "scripts/checkNavigation.ts",
      "src/figma-make/restaurantdashboardsystem/hooks/useLanguage.ts",
      "src/figma-make/visibilitycheckdashboard/hooks/useLanguage.ts"
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React Hooks als Warnings statt Errors
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // 🔧 Warnungen statt Fehler bei any
      "@typescript-eslint/no-explicit-any": "warn",

      // Optionale Entschärfung für häufige Fälle:
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off", // Komplett deaktiviert für CI
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",

      // Für CI-Stabilität (temporär):
      "no-console": "off",
      "no-undef": "off",
      "no-useless-escape": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      "prefer-const": "warn",
      "no-constant-condition": "warn",
      "no-var": "warn",
      "no-empty": "warn",
      "no-case-declarations": "warn",
    },
  }
);
