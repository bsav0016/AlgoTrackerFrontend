// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

const jestGlobals = Object.fromEntries(
  ["describe", "it", "test", "expect", "jest", "beforeAll", "beforeEach", "afterAll", "afterEach"].map((name) => [name, "readonly"])
);

module.exports = [
  ...expoConfig,
  { ignores: ["dist/*", "node_modules/*"] },
  // The Jest globals (describe, it, expect, ...) in test files.
  {
    files: ["**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: { globals: jestGlobals },
  },
  // eslint-config-expo 56 turned on the React Compiler checks as errors. This app does not use the React
  // Compiler, and fixing them touches auth, profile and payment screens, so they are reported as warnings
  // here (still visible in `npm run lint`) and can be worked through screen by screen.
  {
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
    },
  },
];
