import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", ".next/**", "coverage/**"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        caches: "readonly",
        clients: "readonly",
        fetch: "readonly",
        self: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
