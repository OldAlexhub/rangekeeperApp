import mobileAds, {
  AdsConsent,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';

let adsStartPromise: Promise<boolean> | null = null;

export function startMobileAds(): Promise<boolean> {
  if (adsStartPromise) {
    return adsStartPromise;
  }

  adsStartPromise = startMobileAdsInternal();
  return adsStartPromise;
}

async function startMobileAdsInternal(): Promise<boolean> {
  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      testDeviceIdentifiers: ['EMULATOR'],
    });

    try {
      await AdsConsent.gatherConsent();
    } catch {
      // Use the prior consent state if gathering fails, per UMP guidance.
    }

    const { canRequestAds } = await AdsConsent.getConsentInfo();
    if (!canRequestAds) {
      return false;
    }

    await mobileAds().initialize();
    return true;
  } catch {
    return false;
  }
}
