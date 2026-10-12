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

You need a running backend (see the backend README) and a development build, because the app uses native modules (Stripe, RevenueCat, notifications). Expo Go will not work.

```bash
npm install
npm start          # EAS_BUILD_PROFILE=development expo start
npm run android    # or: npm run ios
npm test           # jest --watchAll
npm run lint
```

Configuration lives in `app.config.js`:

- `API_URL` – in development it points at a LAN address (`http://192.168.1.144:8000/`). **Change it to your own machine's address** to talk to a local backend.
- `STRIPE_PUBLIC_KEY` – a publishable key (safe to ship in a client); test key in development, live key for the production EAS profile.
- Android builds also need a `google-services.json` (Firebase), which is not committed.

The npm scripts set `EAS_BUILD_PROFILE` with POSIX syntax (`VAR=value command`), so on Windows run them from Git Bash or WSL, or set the variable yourself.

Production builds: `npm run build-prod` (EAS).

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
