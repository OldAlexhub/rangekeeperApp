import { TestIds } from 'react-native-google-mobile-ads';

const LIVE_BANNER_AD_UNIT_ID = 'ca-app-pub-7831002909037560/1627093779';
const LIVE_INTERSTITIAL_AD_UNIT_ID = '';

export const ADS_ENABLED = true;
export const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.ADAPTIVE_BANNER : LIVE_BANNER_AD_UNIT_ID;
export const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : LIVE_INTERSTITIAL_AD_UNIT_ID;
export const INTERSTITIALS_ENABLED = __DEV__ || LIVE_INTERSTITIAL_AD_UNIT_ID.length > 0;

export const AD_REQUEST_KEYWORDS = [
  'electric vehicle',
  'ev charging',
  'car maintenance',
  'battery',
  'automotive',
];
