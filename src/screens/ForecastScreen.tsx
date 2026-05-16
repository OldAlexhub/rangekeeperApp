import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, ForecastResult } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { LineChart } from '../components/LineChart';
import {
  getActiveVehicle,
  getEntriesForVehicle,
} from '../utils/storage';
import { buildForecast } from '../utils/forecast';
import { roundTo, calculateEstimatedFullRange } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForecastScreen() {
  const navigation = useNavigation<Nav>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    setLoading(true);
    const v = await getActiveVehicle();
    setVehicle(v);

    if (v) {
      const entries = await getEntriesForVehicle(v.id);
      const result = buildForecast(v, entries);
      setForecast(result);

      const sorted = [...entries].sort(
        (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
      );
      const firstDate = sorted.length > 0 ? new Date(sorted[0].entryDate).getTime() : 0;
      const pts = sorted.map(e => ({
        x: (new Date(e.entryDate).getTime() - firstDate) / (1000 * 60 * 60 * 24),
        y: calculateEstimatedFullRange(e.batteryPercent, e.displayedRange),
      }));
      setChartData(pts);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>Forecast</Text></View>
        <View style={styles.center}><Text style={styles.muted}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>Forecast</Text></View>
        <EmptyState
          icon="📈"
          title="No vehicle selected"
          message="Add a vehicle to unlock forecasting."
          actionLabel="Add Vehicle"
          onAction={() => navigation.navigate('VehicleForm', {})}
        />
      </SafeAreaView>
    );
  }

  if (!forecast || !forecast.canForecast) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>Forecast</Text></View>
        <EmptyState
          icon="📊"
          title="Not enough data"
          message={forecast?.reason ?? 'Add at least 3 range check-ins to generate a basic trend.'}
          actionLabel="Log Range"
          onAction={() => navigation.navigate('EntryForm', {})}
        />
        {forecast && (
          <Text style={styles.progressHint}>
            {forecast.dataPoints} of 3 minimum entries logged for {vehicle.nickname}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  const trendStatus =
    forecast.trendDirection === 'improving'
      ? 'improving'
      : forecast.trendDirection === 'declining'
      ? 'declining'
      : 'stable';

  const confidenceColor =
    forecast.confidenceLabel === 'Higher'
      ? Colors.success
      : forecast.confidenceLabel === 'Medium'
      ? Colors.primary
      : Colors.warning;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Forecast</Text>
        </View>

        {/* Vehicle Header */}
        <Card style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
          <View style={styles.vehicleStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Current Estimate</Text>
              <Text style={styles.statValue}>
                {roundTo(forecast.currentEstimatedFullRange, 1)} {vehicle.rangeUnit}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Manufacturer Rated</Text>
              <Text style={styles.statValue}>
                {vehicle.manufacturerRatedRange} {vehicle.rangeUnit}
              </Text>
            </View>
          </View>

          <View style={styles.trendRow}>
            <StatusBadge status={trendStatus} />
            <Text style={styles.trendDetail}>
              {forecast.trendDirection === 'stable'
                ? 'Range estimate is stable'
                : `${Math.abs(roundTo(forecast.monthlyChangeMiles, 2))} ${vehicle.rangeUnit}/month ${forecast.trendDirection === 'improving' ? 'gain' : 'decline'}`}
            </Text>
          </View>

          <View style={[styles.confidencePill, { borderColor: confidenceColor }]}>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              Data confidence: {forecast.confidenceLabel}
            </Text>
            <Text style={styles.dataPointsText}>({forecast.dataPoints} entries)</Text>
          </View>
        </Card>

        {/* Chart */}
        {chartData.length >= 2 && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Estimated Full Range History</Text>
            <LineChart
              data={chartData}
              width={340}
              height={160}
              color={Colors.primary}
              unit={vehicle.rangeUnit}
              referenceY={vehicle.manufacturerRatedRange}
              referenceLabel={`Rated ${vehicle.manufacturerRatedRange}`}
            />
            <Text style={styles.chartHint}>Dashed line = manufacturer rated range</Text>
          </Card>
        )}

        {/* Forecast Points */}
        <Text style={styles.sectionLabel}>Possible Future Estimates</Text>
        <Card style={styles.forecastCard}>
          {forecast.forecasts.map((fp, i) => {
            const diff = fp.estimatedRange - vehicle.manufacturerRatedRange;
            return (
              <View key={i} style={[styles.forecastRow, i < forecast.forecasts.length - 1 && styles.forecastRowBorder]}>
                <Text style={styles.forecastLabel}>{fp.label}</Text>
                <View style={styles.forecastValues}>
                  <Text style={styles.forecastValue}>
                    {roundTo(fp.estimatedRange, 1)} {vehicle.rangeUnit}
                  </Text>
                  <Text
                    style={[
                      styles.forecastDiff,
                      { color: diff >= 0 ? Colors.success : Colors.error },
                    ]}>
                    {diff >= 0 ? '+' : ''}{roundTo(diff, 1)}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Disclaimer */}
        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>About This Forecast</Text>
          <Text style={styles.disclaimerText}>
            Forecasts are possible range trend estimates based on your saved check-ins using simple linear regression. They do not guarantee future range.
          </Text>
          <Text style={styles.disclaimerText}>
            Actual EV range can vary based on temperature, driving style, tires, terrain, charging behavior, vehicle software, and manufacturer range calculation methods.
          </Text>
          <Text style={styles.disclaimerText}>
            This is not a battery diagnostic tool.
          </Text>
        </Card>
      </ScrollView>
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
  scroll: { paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: Colors.textMuted },
  progressHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  vehicleCard: { margin: Spacing.md, gap: Spacing.md },
  vehicleName: { ...Typography.h3, color: Colors.textPrimary },
  vehicleStats: { flexDirection: 'row', gap: Spacing.xl },
  stat: {},
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  statValue: { ...Typography.h4, color: Colors.textPrimary },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trendDetail: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  confidenceText: { ...Typography.caption, fontWeight: '600' },
  dataPointsText: { ...Typography.caption, color: Colors.textMuted },
  chartCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden' },
  chartTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  chartHint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  forecastCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, paddingHorizontal: 0, paddingVertical: 0 },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  forecastRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  forecastLabel: { ...Typography.body, color: Colors.textSecondary },
  forecastValues: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  forecastValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  forecastDiff: { ...Typography.bodySmall, fontWeight: '600' },
  disclaimerCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  disclaimerTitle: { ...Typography.label, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  disclaimerText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 17 },
});
