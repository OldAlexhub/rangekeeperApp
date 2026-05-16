import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Vehicle, RangeEntry } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { getAllVehicles, getAllEntries } from '../utils/storage';
import { shareCsv, shareJson, shareTextReport } from '../utils/export';

export function ReportsScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    setLoading(true);
    const v = await getAllVehicles();
    const e = await getAllEntries();
    setVehicles(v);
    setEntries(e);
    setLoading(false);
  }

  async function handleExport(type: 'csv' | 'json' | 'text') {
    if (vehicles.length === 0 && entries.length === 0) {
      Alert.alert('No Data', 'Add a vehicle and log range entries before exporting.');
      return;
    }

    setExporting(type);
    try {
      if (type === 'csv') {
        await shareCsv(vehicles, entries);
      } else if (type === 'json') {
        await shareJson(vehicles, entries);
      } else {
        await shareTextReport(vehicles, entries);
      }
    } catch {
      Alert.alert('Export Error', 'Could not share the export. Please try again.');
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>Reports</Text></View>
        <View style={styles.center}><Text style={styles.muted}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const hasData = vehicles.length > 0 || entries.length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Summary Stats */}
        <Card style={styles.statsCard} elevated>
          <Text style={styles.statsTitle}>Data Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Vehicle{vehicles.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Check-in{entries.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </Card>

        {!hasData ? (
          <EmptyState
            icon="📤"
            title="No data to export"
            message="Add a vehicle and log range check-ins, then export your data as CSV, JSON, or a text summary."
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Export Options</Text>

            <Card style={styles.exportCard}>
              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>CSV Spreadsheet</Text>
                  <Text style={styles.exportDesc}>
                    Open in Excel, Sheets, or any spreadsheet app. Includes all entries with computed ranges.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleExport('csv')}
                  style={styles.exportBtn}
                  disabled={exporting !== null}>
                  {exporting === 'csv' ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Text style={styles.exportBtnText}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.exportCard}>
              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>JSON Data</Text>
                  <Text style={styles.exportDesc}>
                    Full data export including vehicles, entries, and metadata. Useful for backup or import.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleExport('json')}
                  style={styles.exportBtn}
                  disabled={exporting !== null}>
                  {exporting === 'json' ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Text style={styles.exportBtnText}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.exportCard}>
              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Text Summary Report</Text>
                  <Text style={styles.exportDesc}>
                    Human-readable summary of your range history and forecast estimates per vehicle.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleExport('text')}
                  style={styles.exportBtn}
                  disabled={exporting !== null}>
                  {exporting === 'text' ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Text style={styles.exportBtnText}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>

            <Text style={styles.exportNote}>
              Exports use your device's share sheet. Data is not uploaded anywhere. All processing happens on your device.
            </Text>
          </>
        )}

        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            RangeKeeper EV provides estimates based on manually entered data. It does not diagnose battery health. Actual EV range may vary.
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
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: Colors.textMuted },
  statsCard: {},
  statsTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  statValue: { ...Typography.h1, color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exportCard: { paddingVertical: Spacing.md },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  exportInfo: { flex: 1 },
  exportTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4 },
  exportDesc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  exportBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    minWidth: 64,
    alignItems: 'center',
  },
  exportBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  exportNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  disclaimerCard: { backgroundColor: Colors.surfaceElevated },
  disclaimerText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 17 },
});
