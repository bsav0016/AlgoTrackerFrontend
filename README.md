# AlgoTracker

Mobile app for building simple technical-indicator trading strategies, back-testing them on historical price data, and subscribing to a strategy so you get a push notification when it signals a trade. Built with Expo / React Native; the API lives in [AlgoTrackerBackend](https://github.com/bsav0016/AlgoTrackerBackend).

<!-- TODO: add screenshots (strategy builder, backtest results, subscriptions list) -->

## Why it exists

Trying out a technical-indicator trading idea usually takes code or a desktop charting tool. AlgoTracker lets you assemble a strategy from standard indicators on your phone, back-test it on historical prices, and subscribe to it so you get a push notification when it signals a trade instead of watching charts.

## What it does

- **Build a strategy** – pick a symbol and an interval, then define buy and sell conditions from seven indicators: RSI, SMA and EMA (vs. current price), MACD vs. signal, Stochastic Oscillator, Bollinger %B, and ADX, each with its own window and target settings.
- **Run a backtest** – the backend replays the strategy over historical data; the app shows the resulting trades and return figures.
- **Subscribe to a strategy** – the home screen lists your subscriptions with their current position and return, and the backend sends push notifications on signals (via `expo-notifications`).
- **Credits** – backtests and subscriptions cost credits. Credits are bought with a card (Stripe) or through in-app purchases (RevenueCat). The symbol list, intervals and prices come from the backend.
- **Accounts** – register, log in with JWT, reset a password by email, delete the account.
- A "How it Works" screen explains each indicator input and output.

## Stack

- Expo SDK 53, React Native 0.79, TypeScript, `expo-router` (file-based routing)
- `@stripe/stripe-react-native`, `react-native-purchases` (RevenueCat), `expo-notifications`, `expo-secure-store`
- Jest for tests

## Running it

You need a running backend (see the backend README) and a development build, because the app uses native modules (Stripe, RevenueCat, notifications). Expo Go will not work. Requires Node 18+.

```bash
npm install
cp .env.example .env     # PowerShell: Copy-Item .env.example .env
npm start                # then: npm run android  /  npm run ios
```

The scripts contain no shell-specific syntax, so they run the same on Windows, macOS and Linux.

### Configuration

Settings come from `.env` (git-ignored; Expo loads it automatically, and you need `npx expo start --clear` after editing it). `app.config.js` reads them through `config/resolveConfig.js`; nothing needs editing in source.

| Variable | Purpose | Default |
| --- | --- | --- |
| `API_URL` | Backend address, e.g. `http://192.168.1.20:8000/` | `http://localhost:8000/` |
| `STRIPE_PUBLIC_KEY` | Stripe **publishable** key (`pk_test_...`), only needed to try card deposits | none |

`localhost` only works for the iOS simulator and web. Use `http://10.0.2.2:8000/` for the Android emulator, or your computer's LAN IP on a physical phone. Android builds also need a `google-services.json` (Firebase), which is not committed.

Production builds (`npm run build-prod`, which runs `eas build --profile production`) set `APP_ENV=production` through `eas.json`, and use the deployed API and live publishable key automatically. Set `API_URL` / `STRIPE_PUBLIC_KEY` in the EAS build environment to override them.

### Tests

```bash
npm test             # one run (CI-friendly)
npm run test:watch   # re-run on change
npm run lint         # expo lint (ESLint); existing warnings are tolerated, errors fail
npm run typecheck    # tsc --noEmit; currently reports pre-existing type errors
```

The tests cover environment resolution (`config/resolveConfig.test.js`) and API error handling (`lib/networkRequests/NetworkRequest.test.ts`). They mock `fetch` and never contact a backend.

### CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `master`: `npm ci` (from the committed `package-lock.json`, Node version from `.nvmrc`), a check for hard-coded private URLs or secret keys, lint, type-check (informational until the existing type errors are fixed), tests, and a production JavaScript bundle (`expo export`). It needs no secrets. Store builds are not part of CI; releases stay manual with `npm run build-prod`. Commit changes to `package-lock.json` along with `package.json`.

## Design decisions

- **Backtesting on the server.** Pricing data, indicators and metrics are computed by the backend (pandas); the app only configures strategies and renders results.
- **Credits instead of subscriptions-per-feature.** Usage costs come from the backend (`backtestBaseCost`, `backtestIterations`), so pricing can change without an app release.
- **Two payment paths.** Stripe for card payments and RevenueCat for store purchases, both crediting the same account balance.
- **Config chosen by EAS build profile**, so the production build uses the production API and live Stripe key without code changes.

## Limitations

- Development API URL is hard-coded in `app.config.js` and must be edited.
- npm scripts assume a POSIX shell.
- Back-test results are historical simulations, not investment advice. <!-- TODO: confirm wording you want here -->
- <!-- TODO: current status – is the app published, and is the production backend still running? Last commit here is May 2025. -->

## License

MIT. See [LICENSE](LICENSE).
