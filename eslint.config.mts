import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import n from "eslint-plugin-n";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {
      js,
      n,
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
    },
    extends: [js.configs.recommended, n.configs["flat/recommended"]],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...n.configs.recommended.rules,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
  },
  {
    rules: {
      "n/no-unpublished-import": "off",
    },
  },
  tseslint.configs.recommended,
]);
