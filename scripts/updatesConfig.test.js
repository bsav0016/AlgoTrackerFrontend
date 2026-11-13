/**
 * Guards the over-the-air update setup. Nothing here talks to Expo: it only checks that the config a
 * release build is made from still has what updates need, so a cleanup cannot silently turn them off.
 */
const eas = require('../eas.json');
const pkg = require('../package.json');
const { resolveConfig, PRODUCTION_API_URL } = require('../config/resolveConfig');
const appConfig = require('../app.config.js').default;

const app = appConfig.expo;

describe('over-the-air updates', () => {
  test('has expo-updates installed', () => {
    expect(pkg.dependencies['expo-updates']).toBeDefined();
  });

  test('points at this project\'s EAS update endpoint', () => {
    expect(app.updates.url).toBe(`https://u.expo.dev/${app.extra.eas.projectId}`);
  });

  test('only delivers an update to builds of the same app version', () => {
    // If this became a fixed string or were removed, JS needing new native code could reach builds without it.
    expect(app.runtimeVersion).toEqual({ policy: 'appVersion' });
  });

  test('builds each profile for its own channel', () => {
    expect(eas.build.production.channel).toBe('production');
    expect(eas.build.preview.channel).toBe('preview');
    expect(eas.build.development.channel).toBe('development');
  });

  test('never lets a preview build listen to the production channel', () => {
    const channels = Object.values(eas.build).map((profile) => profile.channel);
    expect(new Set(channels).size).toBe(channels.length);
  });

  // The production update is bundled with whatever the config resolves to when it is published. Without
  // APP_ENV=production that is localhost, which would break every phone that downloads it.
  test('a production update (APP_ENV=production) bundles the production API and Stripe key', () => {
    const config = resolveConfig({ APP_ENV: 'production' });
    expect(config.API_URL).toBe(PRODUCTION_API_URL);
    expect(config.STRIPE_PUBLIC_KEY).toMatch(/^pk_live_/);
  });

  test('without it the config points at localhost, which is why the publish script sets it', () => {
    expect(resolveConfig({}).API_URL).toBe('http://localhost:8000/');
  });
});
