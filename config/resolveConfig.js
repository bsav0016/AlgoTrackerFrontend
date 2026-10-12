// Pure function so it can be unit-tested; app.config.js feeds it process.env.
// Production values are the deployed defaults, so existing EAS production builds keep working
// unchanged; everything can still be overridden through the environment.
const PRODUCTION_API_URL = "https://algo-tracker-api.collagecreations.org/";
const PRODUCTION_STRIPE_PUBLIC_KEY = "pk_live_51K3Z43KQPt6SvxbCYjiFsRWquBwI7abgPdxwRC4Qlma9myzEzKUwr0uCIc3URtyIF9O4Xkxws9fSyusrbr0aU22x00BOzYDqU7";
const DEVELOPMENT_API_URL = "http://localhost:8000/";

const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);

const resolveConfig = (env = {}) => {
  const isProduction = env.APP_ENV === "production" || env.EAS_BUILD_PROFILE === "production";
  const apiUrl = (env.API_URL || "").trim() || (isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL);
  const stripeKey = (env.STRIPE_PUBLIC_KEY || "").trim()
    || (isProduction ? PRODUCTION_STRIPE_PUBLIC_KEY : "");

  return {
    isProduction,
    // The app builds request URLs as `${API_URL}api/...`, so it must end in a slash.
    API_URL: withTrailingSlash(apiUrl),
    STRIPE_PUBLIC_KEY: stripeKey,
  };
};

module.exports = { resolveConfig, PRODUCTION_API_URL, DEVELOPMENT_API_URL };
