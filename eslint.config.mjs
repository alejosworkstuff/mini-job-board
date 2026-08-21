import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/**", "docs/**", "test-results/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        location: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Event: "readonly",
        history: "readonly",
        navigator: "readonly",
        requestAnimationFrame: "readonly",
      },
    },
  },
  {
    files: ["playwright.config.js", "scripts/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];
