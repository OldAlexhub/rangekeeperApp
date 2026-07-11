import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from 'react-native-google-mobile-ads';

import { ADS_ENABLED, AD_REQUEST_KEYWORDS, BANNER_AD_UNIT_ID } from '../config/ads';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { startMobileAds } from '../utils/ads';

type Props = {
  placement:
    | 'dashboard'
    | 'settings'
    | 'forecast'
    | 'history'
    | 'reports'
    | 'entry_detail';
};

export function AdBanner({ placement }: Props) {
  const bannerRef = useRef<BannerAd>(null);
  const [adsReady, setAdsReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    startMobileAds().then(ready => {
      if (mounted) {
        setAdsReady(ready);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  if (!ADS_ENABLED || !adsReady || failed) {
    return null;
  }

  return (
    <View style={styles.wrapper} accessibilityLabel={`Advertisement: ${placement}`}>
      <Text style={styles.label}>Advertisement</Text>
      <BannerAd
        ref={bannerRef}
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          keywords: AD_REQUEST_KEYWORDS,
        }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
});
