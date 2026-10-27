// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

const jestGlobals = Object.fromEntries(
  ["describe", "it", "test", "expect", "jest", "beforeAll", "beforeEach", "afterAll", "afterEach"].map((name) => [name, "readonly"])
);

module.exports = [
  ...expoConfig,
  { ignores: ["dist/*", "node_modules/*"] },
  // The Jest globals (describe, it, expect, ...) in test files; eslint-config-expo no longer defines them.
  {
    files: ["**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: { globals: jestGlobals },
  },
];
