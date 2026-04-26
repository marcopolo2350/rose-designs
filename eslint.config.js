import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["scripts/main.js", "scripts/core/**/*.js", "scripts/cloud/**/*.js", "scripts/devtools/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        location: "readonly",
        performance: "readonly",
        window: "readonly",
        localStorage: "readonly",
        activeProfile: "readonly",
        projects: "readonly",
        toast: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/devtools/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];
