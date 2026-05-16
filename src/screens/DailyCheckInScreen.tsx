import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Typography } from '../theme/colors';
import { Button } from '../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DailyCheckInScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-In</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.heading}>Log Today's Range</Text>
        <Text style={styles.body}>
          Enter your vehicle's current battery percentage and displayed range estimate.
        </Text>
        <Button
          label="Open Check-In Form"
          onPress={() => navigation.navigate('EntryForm', {})}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.h3, color: Colors.textPrimary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  heading: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  btn: { minWidth: 220 },
});
