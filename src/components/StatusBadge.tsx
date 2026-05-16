import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

type StatusType = 'above_rated' | 'at_rated' | 'below_rated' | 'improving' | 'stable' | 'declining';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; bg: string; text: string }> = {
  above_rated: { label: 'Above Rated', bg: Colors.successMuted, text: Colors.success },
  at_rated: { label: 'At Rated', bg: Colors.primaryMuted, text: Colors.primary },
  below_rated: { label: 'Below Rated', bg: Colors.errorMuted, text: Colors.error },
  improving: { label: 'Improving', bg: Colors.successMuted, text: Colors.success },
  stable: { label: 'Stable', bg: Colors.primaryMuted, text: Colors.primary },
  declining: { label: 'Declining', bg: Colors.warningMuted, text: Colors.warning },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.label,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
