import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../theme/colors';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, [opacity, scale, onDone]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>RangeKeeper EV</Text>
        <Text style={styles.tagline}>Track your EV range.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    ...Typography.h2,
    color: Colors.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
