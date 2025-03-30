const dotenv = require('dotenv');

if (process.env.EAS_BUILD_PROFILE === 'production') {
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
      supportsTablet: true,
      bundleIdentifier: "com.bsav0016.AlgoTracker",
      infoPlist: {
        NSCameraUsageDescription: "Some dependencies reference camera access, but this app does not actively use the camera.",
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.bsav0016.AlgoTracker",
      googleServicesFile: "./google-services.json"
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
      API_URL: process.env.API_URL || 'default',
      eas: {
        projectId: "d3469b31-6534-4636-a88f-5770b20be119"
      }
    },
    owner: "bsav0016"
  }
};
