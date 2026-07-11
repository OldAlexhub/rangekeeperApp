jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('./src/components/SplashScreen', () => ({
  SplashScreen: () => null,
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async () => 'default'),
    displayNotification: jest.fn(async () => undefined),
    cancelNotification: jest.fn(async () => undefined),
    cancelAllNotifications: jest.fn(async () => undefined),
    createTriggerNotification: jest.fn(async () => undefined),
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  AuthorizationStatus: { AUTHORIZED: 1, DENIED: 0 },
  RepeatFrequency: { DAILY: 1 },
  TimestampTrigger: jest.fn(),
  TriggerType: { TIMESTAMP: 0 },
}));

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => ({
      initialize: jest.fn(async () => []),
      setRequestConfiguration: jest.fn(async () => undefined),
    }),
    AdsConsent: {
      gatherConsent: jest.fn(async () => undefined),
      getConsentInfo: jest.fn(async () => ({ canRequestAds: true })),
    },
    BannerAd: React.forwardRef(() => null),
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    },
    MaxAdContentRating: { PG: 'PG' },
    TestIds: {
      ADAPTIVE_BANNER: 'test-adaptive-banner',
    },
    useForeground: jest.fn(),
  };
});
