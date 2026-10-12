const { resolveConfig, PRODUCTION_API_URL, DEVELOPMENT_API_URL } = require("./resolveConfig");

describe("resolveConfig", () => {
  describe("development", () => {
    it("defaults to localhost and no Stripe key when nothing is set", () => {
      expect(resolveConfig({})).toEqual({
        isProduction: false,
        API_URL: "http://localhost:8000/",
        STRIPE_PUBLIC_KEY: "",
      });
      expect(DEVELOPMENT_API_URL).toBe("http://localhost:8000/");
    });

    it("uses API_URL and STRIPE_PUBLIC_KEY from the environment", () => {
      const config = resolveConfig({ API_URL: "http://192.168.0.20:8000/", STRIPE_PUBLIC_KEY: "pk_test_abc" });
      expect(config.API_URL).toBe("http://192.168.0.20:8000/");
      expect(config.STRIPE_PUBLIC_KEY).toBe("pk_test_abc");
    });

    it("adds the trailing slash request URLs depend on", () => {
      expect(resolveConfig({ API_URL: "http://10.0.2.2:8000" }).API_URL).toBe("http://10.0.2.2:8000/");
    });

    it("treats blank or whitespace-only values as unset", () => {
      const config = resolveConfig({ API_URL: "   ", STRIPE_PUBLIC_KEY: " " });
      expect(config.API_URL).toBe(DEVELOPMENT_API_URL);
      expect(config.STRIPE_PUBLIC_KEY).toBe("");
    });

    it("does not treat other EAS profiles as production", () => {
      expect(resolveConfig({ EAS_BUILD_PROFILE: "preview" }).isProduction).toBe(false);
      expect(resolveConfig({ EAS_BUILD_PROFILE: "development" }).API_URL).toBe(DEVELOPMENT_API_URL);
    });
  });

  describe("production", () => {
    it.each([
      ["APP_ENV", { APP_ENV: "production" }],
      ["EAS_BUILD_PROFILE", { EAS_BUILD_PROFILE: "production" }],
    ])("is detected from %s and uses the deployed API", (_name, env) => {
      const config = resolveConfig(env);
      expect(config.isProduction).toBe(true);
      expect(config.API_URL).toBe(PRODUCTION_API_URL);
      expect(PRODUCTION_API_URL).toBe("https://algo-tracker-api.collagecreations.org/");
    });

    it("defaults to the live publishable key, never a test key or a localhost URL", () => {
      const config = resolveConfig({ APP_ENV: "production" });
      expect(config.STRIPE_PUBLIC_KEY).toMatch(/^pk_live_/);
      expect(config.API_URL).not.toMatch(/localhost|192\.168|10\.0\.2\.2/);
    });

    it("lets the build environment override the defaults", () => {
      const config = resolveConfig({
        APP_ENV: "production",
        API_URL: "https://staging.example.com",
        STRIPE_PUBLIC_KEY: "pk_live_override",
      });
      expect(config.API_URL).toBe("https://staging.example.com/");
      expect(config.STRIPE_PUBLIC_KEY).toBe("pk_live_override");
    });
  });
});
