import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // CLAUDE.md §5: prohibido `any`. Si el tipo es difícil, usar `unknown`.
      "@typescript-eslint/no-explicit-any": "error",
      // CLAUDE.md §5: sin console.log en el código entregado; errores a Sentry.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Los scripts de línea de comandos (importación, semillas) sí imprimen su
    // reporte por consola; ahí no aplica la prohibición de console.
    files: ["scripts/**/*.ts", "scripts/**/*.mts"],
    rules: {
      "no-console": "off",
    },
  },
  // Debe ir al final: desactiva reglas de ESLint que chocan con Prettier.
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Migraciones generadas por `payload migrate:create`: no se editan a mano.
    "src/migrations/**",
  ]),
]);

export default eslintConfig;
