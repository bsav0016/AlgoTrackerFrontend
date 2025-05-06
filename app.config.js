export const API_URL = (process.env.EAS_BUILD_PROFILE === 'production')
  ? "https://algo-tracker-api.collagecreations.org/"
  : "http://192.168.1.144:8000/";
export const STRIPE_PUBLIC_KEY = (process.env.EAS_BUILD_PROFILE === 'production')
  ? "pk_live_51K3Z43KQPt6SvxbCYjiFsRWquBwI7abgPdxwRC4Qlma9myzEzKUwr0uCIc3URtyIF9O4Xkxws9fSyusrbr0aU22x00BOzYDqU7"
  : "pk_test_51K3Z43KQPt6SvxbCq2DWQAxjj2fSskBhazWMiBI4WM6XRgOoDUSckkHxZzWaSXgIO55qf3EAi0lo2X4iab44nHIl00amJ9PVxZ"


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
      STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY || 'default',
      API_URL: API_URL || 'default',
      eas: {
        projectId: "d3469b31-6534-4636-a88f-5770b20be119"
      }
    },
    owner: "bsav0016"
  }
};
