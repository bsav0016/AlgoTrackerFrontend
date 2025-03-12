const dotenv = require('dotenv');

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.development' });
}

export default {
  expo: {
    name: "AlgoTracker",
    slug: "AlgoTracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "AlgoTracker",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-notifications",
        {
          color: "#ffffff",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: true
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.AlgoTracker",
          "publishableKey": "Constants.expoConfig?.extra?.STRIPE_PUBLIC_KEY"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || 'default',
      API_URL: process.env.API_URL || 'default'
    }
  }
};
