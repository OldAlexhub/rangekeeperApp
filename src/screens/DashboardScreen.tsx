import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, RangeEntry, ComputedEntry } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { LineChart } from '../components/LineChart';
import {
  getActiveVehicle,
  getLatestEntryForVehicle,
  getEntriesForVehicle,
} from '../utils/storage';
import { computeEntry, roundTo, formatRange, formatPercent } from '../utils/calculations';
import { buildForecast } from '../utils/forecast';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [latestEntry, setLatestEntry] = useState<RangeEntry | null>(null);
  const [computed, setComputed] = useState<ComputedEntry | null>(null);
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  const [forecastLabel, setForecastLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function loadData() {
    try {
      setError(false);
      const v = await getActiveVehicle();
      setVehicle(v);

      if (v) {
        const latest = await getLatestEntryForVehicle(v.id);
        setLatestEntry(latest);

        if (latest) {
          setComputed(computeEntry(latest, v));
        } else {
          setComputed(null);
        }

        const entries = await getEntriesForVehicle(v.id);
        const sorted = [...entries].sort(
          (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
        );
        const firstDate = sorted.length > 0 ? new Date(sorted[0].entryDate).getTime() : 0;
        const points = sorted.slice(-10).map(e => ({
          x: (new Date(e.entryDate).getTime() - firstDate) / (1000 * 60 * 60 * 24),
          y: e.displayedRange / (e.batteryPercent / 100),
        }));
        setChartData(points);

        const forecast = buildForecast(v, entries);
        if (forecast.canForecast) {
          const trend =
            forecast.trendDirection === 'improving'
              ? 'trending up'
              : forecast.trendDirection === 'declining'
              ? 'trending down'
              : 'stable';
          setForecastLabel(
            `${Math.abs(roundTo(forecast.monthlyChangeMiles, 1))} ${v.rangeUnit}/mo, ${trend}`,
          );
        } else {
          setForecastLabel('');
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load data.</Text>
          <Button label="Retry" onPress={loadData} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.appName}>RangeKeeper EV</Text>
          <Text style={styles.tagline}>Track your EV range. Understand the trend.</Text>
        </View>
        <EmptyState
          icon="⚡"
          title="Welcome to RangeKeeper EV"
          message="Add your EV to start tracking range and understanding your estimate trends."
          actionLabel="Add Vehicle"
          onAction={() => navigation.navigate('VehicleForm', {})}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.appName}>RangeKeeper EV</Text>
        </View>

        {/* Active Vehicle Card */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleCardTop}>
            <View>
              <Text style={styles.vehicleNickname}>{vehicle.nickname}</Text>
              {(vehicle.make || vehicle.model || vehicle.year) ? (
                <Text style={styles.vehicleDetails}>
                  {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                </Text>
              ) : null}
            </View>
            <View style={styles.ratedRangePill}>
              <Text style={styles.ratedRangeLabel}>Rated</Text>
              <Text style={styles.ratedRangeValue}>
                {vehicle.manufacturerRatedRange} {vehicle.rangeUnit}
              </Text>
            </View>
          </View>
        </Card>

        {!latestEntry ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Your vehicle is ready.</Text>
            <Text style={styles.emptyCardSub}>Add your first range check-in to start tracking.</Text>
            <Button
              label="Add First Check-In"
              onPress={() => navigation.navigate('Main' as any)}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : (
          <>
            {/* Latest Reading Card */}
            <Card style={styles.readingCard} elevated>
              <View style={styles.readingRow}>
                <View style={styles.readingItem}>
                  <Text style={styles.readingLabel}>Battery</Text>
                  <Text style={styles.readingValue}>{latestEntry.batteryPercent}%</Text>
                </View>
                <View style={styles.readingDivider} />
                <View style={styles.readingItem}>
                  <Text style={styles.readingLabel}>Displayed</Text>
                  <Text style={styles.readingValue}>
                    {latestEntry.displayedRange} {vehicle.rangeUnit}
                  </Text>
                </View>
                <View style={styles.readingDivider} />
                <View style={styles.readingItem}>
                  <Text style={styles.readingLabel}>Estimated 100%</Text>
                  <Text style={[styles.readingValue, { color: Colors.primary }]}>
                    {computed ? roundTo(computed.estimatedFullRange, 1) : '--'} {vehicle.rangeUnit}
                  </Text>
                </View>
              </View>

              {computed && (
                <View style={styles.statusRow}>
                  <StatusBadge status={computed.rangeStatus} />
                  {computed.rangeStatus === 'above_rated' ? (
                    <Text style={styles.statusDetail}>
                      +{formatRange(computed.aboveRatedAmount, vehicle.rangeUnit)} above rated
                    </Text>
                  ) : computed.rangeStatus === 'below_rated' ? (
                    <Text style={styles.statusDetail}>
                      -{formatRange(computed.estimatedRangeLoss, vehicle.rangeUnit)} ({formatPercent(computed.estimatedRangeLossPercent)} below rated)
                    </Text>
                  ) : (
                    <Text style={styles.statusDetail}>At rated estimate</Text>
                  )}
                </View>
              )}

              <Text style={styles.entryDate}>
                Last check-in: {new Date(latestEntry.entryDate).toLocaleDateString()}
              </Text>
            </Card>

            {/* Trend/Forecast mini card */}
            {forecastLabel ? (
              <Card style={styles.trendCard}>
                <View style={styles.trendRow}>
                  <Text style={styles.trendIcon}>📈</Text>
                  <View style={styles.trendContent}>
                    <Text style={styles.trendTitle}>Trend estimate</Text>
                    <Text style={styles.trendValue}>{forecastLabel}</Text>
                  </View>
                </View>
              </Card>
            ) : null}

            {/* Mini chart */}
            {chartData.length >= 2 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>Estimated Full Range Over Time</Text>
                <LineChart
                  data={chartData}
                  width={320}
                  height={140}
                  color={Colors.primary}
                  unit={vehicle.rangeUnit}
                  referenceY={vehicle.manufacturerRatedRange}
                  referenceLabel={`Rated ${vehicle.manufacturerRatedRange}`}
                />
                <Text style={styles.chartHint}>Dashed line = manufacturer rated range</Text>
              </Card>
            ) : null}
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            label="Log Today's Range"
            onPress={() => navigation.navigate('EntryForm', {})}
            style={styles.primaryAction}
          />
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          For informational use only. Not a battery diagnostic tool. Estimates based on manually entered data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  appName: {
    ...Typography.h2,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehicleCard: {
    marginBottom: Spacing.md,
  },
  vehicleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleNickname: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  vehicleDetails: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratedRangePill: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  ratedRangeLabel: {
    ...Typography.caption,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratedRangeValue: {
    ...Typography.h4,
    color: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyCardText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyCardSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  readingCard: {
    marginBottom: Spacing.md,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  readingItem: {
    flex: 1,
    alignItems: 'center',
  },
  readingDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  readingLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingValue: {
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  trendCard: {
    marginBottom: Spacing.md,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trendIcon: {
    fontSize: 24,
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  chartTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  quickActions: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  primaryAction: {
    width: '100%',
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 16,
  },
});
