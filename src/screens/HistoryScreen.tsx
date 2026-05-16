import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, RangeEntry, ComputedEntry } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import {
  getAllVehicles,
  getAllEntries,
  deleteRangeEntry,
  getActiveVehicle,
} from '../utils/storage';
import { computeEntry, roundTo } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [entries, setEntries] = useState<ComputedEntry[]>([]);
  const [filterVehicleId, setFilterVehicleId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    setLoading(true);
    const allVehicles = await getAllVehicles();
    const allEntries = await getAllEntries();
    const vehicleMap = new Map(allVehicles.map(v => [v.id, v]));

    const computed = allEntries
      .map(entry => {
        const v = vehicleMap.get(entry.vehicleId);
        if (!v) return null;
        return computeEntry(entry, v);
      })
      .filter((e): e is ComputedEntry => e !== null)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    setVehicles(allVehicles);
    setEntries(computed);
    setLoading(false);
  }

  async function handleDelete(entry: ComputedEntry) {
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
            await load();
          },
        },
      ],
    );
  }

  const filtered =
    filterVehicleId === 'all'
      ? entries
      : entries.filter(e => e.vehicleId === filterVehicleId);

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>History</Text></View>
        <View style={styles.center}><Text style={styles.muted}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('EntryForm', {})}
          style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            onPress={() => setFilterVehicleId('all')}
            style={[styles.filterChip, filterVehicleId === 'all' && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filterVehicleId === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {vehicles.map(v => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setFilterVehicleId(v.id)}
              style={[styles.filterChip, filterVehicleId === v.id && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filterVehicleId === v.id && styles.filterChipTextActive]}>
                {v.nickname}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No entries yet"
          message={
            vehicles.length === 0
              ? 'Add a vehicle first, then log your first range check-in.'
              : 'Log your first range check-in to start tracking history.'
          }
          actionLabel={vehicles.length === 0 ? 'Add Vehicle' : 'Log Range'}
          onAction={() =>
            vehicles.length === 0
              ? navigation.navigate('VehicleForm', {})
              : navigation.navigate('EntryForm', {})
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {filtered.map((entry, idx) => {
            const vehicle = vehicleMap.get(entry.vehicleId);
            const prevEntry = filtered[idx + 1];
            const prevVehicle = prevEntry ? vehicleMap.get(prevEntry.vehicleId) : null;
            const sameDayAsPrev =
              prevEntry && prevEntry.entryDate === entry.entryDate && prevEntry.vehicleId === entry.vehicleId;

            return (
              <React.Fragment key={entry.id}>
                {sameDayAsPrev && (
                  <View style={styles.dupWarning}>
                    <Text style={styles.dupWarningText}>Multiple entries for this date</Text>
                  </View>
                )}
                <Card style={styles.entryCard}>
                  <View style={styles.entryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryDate}>
                        {new Date(entry.entryDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {vehicles.length > 1 && vehicle && (
                        <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
                      )}
                    </View>
                    <StatusBadge status={entry.rangeStatus} />
                  </View>

                  <View style={styles.entryStats}>
                    <View style={styles.entryStat}>
                      <Text style={styles.entryStatLabel}>Battery</Text>
                      <Text style={styles.entryStatValue}>{entry.batteryPercent}%</Text>
                    </View>
                    <View style={styles.entryStat}>
                      <Text style={styles.entryStatLabel}>Displayed</Text>
                      <Text style={styles.entryStatValue}>
                        {entry.displayedRange} {vehicle?.rangeUnit ?? ''}
                      </Text>
                    </View>
                    <View style={styles.entryStat}>
                      <Text style={styles.entryStatLabel}>Est. 100%</Text>
                      <Text style={[styles.entryStatValue, { color: Colors.primary }]}>
                        {roundTo(entry.estimatedFullRange, 1)} {vehicle?.rangeUnit ?? ''}
                      </Text>
                    </View>
                  </View>

                  {entry.rangeStatus === 'above_rated' ? (
                    <Text style={styles.entryNote}>
                      +{roundTo(entry.aboveRatedAmount, 1)} {vehicle?.rangeUnit} above rated
                    </Text>
                  ) : entry.rangeStatus === 'below_rated' ? (
                    <Text style={styles.entryNote}>
                      -{roundTo(entry.estimatedRangeLoss, 1)} {vehicle?.rangeUnit} ({roundTo(entry.estimatedRangeLossPercent, 1)}% below rated)
                    </Text>
                  ) : null}

                  {(entry.odometer || entry.temperature || entry.drivingContext) ? (
                    <View style={styles.entryExtra}>
                      {entry.odometer ? (
                        <Text style={styles.entryExtraText}>Odo: {entry.odometer}</Text>
                      ) : null}
                      {entry.temperature ? (
                        <Text style={styles.entryExtraText}>
                          {entry.temperature}{entry.temperatureUnit ?? ''}
                        </Text>
                      ) : null}
                      {entry.drivingContext ? (
                        <Text style={styles.entryExtraText}>{entry.drivingContext}</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {entry.notes ? (
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  ) : null}

                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EntryForm', { entryId: entry.id })}
                      style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(entry)}
                      style={[styles.actionBtn, styles.actionBtnDelete]}>
                      <Text style={styles.actionBtnDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </React.Fragment>
            );
          })}
          <Text style={styles.totalCount}>{filtered.length} entry{filtered.length !== 1 ? 'ies' : 'y'}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
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
  title: { ...Typography.h3, color: Colors.textPrimary },
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  filterScroll: { maxHeight: 52 },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  filterChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: Colors.textMuted },
  dupWarning: {
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: -Spacing.xs,
  },
  dupWarningText: { ...Typography.caption, color: Colors.warning },
  entryCard: { gap: Spacing.sm },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  entryDate: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  vehicleName: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  entryStats: { flexDirection: 'row', gap: Spacing.md },
  entryStat: {},
  entryStatLabel: { ...Typography.caption, color: Colors.textMuted },
  entryStatValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  entryNote: { ...Typography.bodySmall, color: Colors.textSecondary },
  entryExtra: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  entryExtraText: { ...Typography.caption, color: Colors.textMuted },
  entryNotes: { ...Typography.bodySmall, color: Colors.textSecondary, fontStyle: 'italic' },
  entryActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnText: { ...Typography.caption, color: Colors.textSecondary },
  actionBtnDelete: { borderColor: Colors.error },
  actionBtnDeleteText: { ...Typography.caption, color: Colors.error },
  totalCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
