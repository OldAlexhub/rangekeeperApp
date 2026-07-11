import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, RangeEntry } from '../types';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { LineChart } from '../components/LineChart';
import { AdBanner } from '../components/AdBanner';
import { deleteRangeEntry, getAllEntries, getAllVehicles } from '../utils/storage';
import { buildEntryAnalysis, EntryAnalysis } from '../utils/entryAnalysis';
import { roundTo } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'EntryDetail'>;

export function EntryDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [entry, setEntry] = useState<RangeEntry | null>(null);
  const [analysis, setAnalysis] = useState<EntryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [route.params.entryId]),
  );

  async function load() {
    setLoading(true);
    const [vehicles, entries] = await Promise.all([getAllVehicles(), getAllEntries()]);
    const foundEntry = entries.find(e => e.id === route.params.entryId) ?? null;
    const foundVehicle = foundEntry
      ? vehicles.find(v => v.id === foundEntry.vehicleId) ?? null
      : null;

    setEntry(foundEntry);
    setVehicle(foundVehicle);
    setAnalysis(foundEntry && foundVehicle ? buildEntryAnalysis(foundVehicle, foundEntry, entries) : null);
    setLoading(false);
  }

  function handleDelete() {
    if (!entry) return;

    Alert.alert(
      'Delete Entry',
      `Delete this check-in from ${new Date(entry.entryDate).toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRangeEntry(entry.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.muted}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry || !vehicle || !analysis) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.muted}>Entry not found.</Text>
          <Button label="Back to History" onPress={() => navigation.goBack()} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  const computed = analysis.entry;
  const toneBarStyle = (tone: 'info' | 'good' | 'warning') => {
    if (tone === 'good') return styles.goodBar;
    if (tone === 'warning') return styles.warningBar;
    return styles.infoBar;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AdBanner placement="entry_detail" />

        <Card style={styles.heroCard} elevated>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateText}>
                {new Date(entry.entryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.vehicleText}>{vehicle.nickname}</Text>
            </View>
            <StatusBadge status={computed.rangeStatus} />
          </View>

          <View style={styles.primaryMetric}>
            <Text style={styles.metricLabel}>Estimated 100% Range</Text>
            <Text style={styles.metricValue}>
              {roundTo(computed.estimatedFullRange, 1)} {vehicle.rangeUnit}
            </Text>
            <Text style={styles.metricSub}>
              Rated {vehicle.manufacturerRatedRange} {vehicle.rangeUnit}
            </Text>
          </View>

          <View style={styles.statGrid}>
            <Stat label="Battery" value={`${entry.batteryPercent}%`} />
            <Stat label="Displayed" value={`${entry.displayedRange} ${vehicle.rangeUnit}`} />
            <Stat
              label="Difference"
              value={`${computed.rangeDifference >= 0 ? '+' : ''}${roundTo(computed.rangeDifference, 1)} ${vehicle.rangeUnit}`}
            />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Analysis</Text>
        {analysis.insights.map((insight, index) => (
          <Card key={`${insight.title}-${index}`} style={styles.insightCard}>
            <View style={[styles.toneBar, toneBarStyle(insight.tone)]} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          </Card>
        ))}

        {analysis.chartData.length >= 2 ? (
          <>
            <Text style={styles.sectionLabel}>Nearby Trend</Text>
            <Card style={styles.chartCard}>
              <LineChart
                data={analysis.chartData}
                width={340}
                height={160}
                color={Colors.primary}
                unit={vehicle.rangeUnit}
                referenceY={vehicle.manufacturerRatedRange}
                referenceLabel={`Rated ${vehicle.manufacturerRatedRange}`}
              />
              <Text style={styles.chartHint}>Shows nearby entries around this check-in.</Text>
            </Card>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Tips</Text>
        <Card style={styles.tipsCard}>
          {analysis.tips.map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipNumber}>{index + 1}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

        {(entry.odometer || entry.temperature || entry.drivingContext || entry.notes) ? (
          <>
            <Text style={styles.sectionLabel}>Logged Context</Text>
            <Card style={styles.contextCard}>
              {entry.odometer ? <ContextRow label="Odometer" value={String(entry.odometer)} /> : null}
              {entry.temperature !== undefined ? (
                <ContextRow label="Temperature" value={`${entry.temperature}${entry.temperatureUnit ?? ''}`} />
              ) : null}
              {entry.drivingContext ? <ContextRow label="Driving" value={entry.drivingContext} /> : null}
              {entry.notes ? <ContextRow label="Notes" value={entry.notes} /> : null}
            </Card>
          </>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Edit Entry"
            variant="secondary"
            onPress={() => navigation.navigate('EntryForm', { entryId: entry.id })}
            style={styles.actionButton}
          />
          <Button
            label="Delete"
            variant="destructive"
            onPress={handleDelete}
            style={styles.actionButton}
          />
        </View>

        <Text style={styles.disclaimer}>
          Analysis is informational only. Range estimates are based on manually entered display readings and are not a battery diagnosis.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Entry Analysis</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.contextRow}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingVertical: Spacing.xs + 2, paddingRight: Spacing.sm },
  backBtnText: { ...Typography.body, color: Colors.primary },
  title: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  muted: { ...Typography.body, color: Colors.textMuted },
  heroCard: { gap: Spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  dateText: { ...Typography.h3, color: Colors.textPrimary },
  vehicleText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  primaryMetric: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  metricLabel: { ...Typography.caption, color: Colors.textMuted, textTransform: 'uppercase' },
  metricValue: { ...Typography.h1, color: Colors.primary, marginTop: Spacing.xs },
  metricSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  statGrid: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1 },
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  statValue: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: '600' },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  toneBar: { width: 4 },
  infoBar: { backgroundColor: Colors.primary },
  goodBar: { backgroundColor: Colors.success },
  warningBar: { backgroundColor: Colors.warning },
  insightContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  insightTitle: { ...Typography.h4, color: Colors.textPrimary },
  insightText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 19 },
  chartCard: { overflow: 'hidden' },
  chartHint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
  tipsCard: { gap: Spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipNumber: {
    ...Typography.caption,
    color: Colors.textInverse,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '700',
  },
  tipText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 19, flex: 1 },
  contextCard: { gap: Spacing.sm },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  contextLabel: { ...Typography.bodySmall, color: Colors.textMuted },
  contextValue: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1 },
  disclaimer: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
