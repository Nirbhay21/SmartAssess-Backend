import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import n from "eslint-plugin-n";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, n },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      ...n.configs.recommended.rules,
    },
  },
  {
    files: ["eslint.config.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      "n/no-unpublished-import": "off",
    },
  },
  tseslint.configs.recommended,
]);
