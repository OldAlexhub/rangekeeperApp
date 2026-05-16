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

import { RootStackParamList, Vehicle } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import {
  getAllVehicles,
  deleteVehicleAndEntries,
  setActiveVehicleId,
  getActiveVehicleId,
  getEntriesForVehicle,
} from '../utils/storage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function VehiclesScreen() {
  const navigation = useNavigation<Nav>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    setLoading(true);
    const all = await getAllVehicles();
    const aid = await getActiveVehicleId();
    setVehicles(all);
    setActiveId(aid);
    setLoading(false);
  }

  async function handleSetActive(id: string) {
    await setActiveVehicleId(id);
    setActiveId(id);
  }

  async function handleDelete(vehicle: Vehicle) {
    const entries = await getEntriesForVehicle(vehicle.id);
    const hasEntries = entries.length > 0;

    Alert.alert(
      'Delete Vehicle',
      hasEntries
        ? `Deleting "${vehicle.nickname}" will also delete its ${entries.length} range check-in${entries.length === 1 ? '' : 's'}. This cannot be undone.`
        : `Delete "${vehicle.nickname}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVehicleAndEntries(vehicle.id);
            await load();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicles</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicles</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('VehicleForm', {})}
          style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <EmptyState
          icon="🚗"
          title="No EVs yet"
          message="Add your first EV to start tracking range."
          actionLabel="Add Vehicle"
          onAction={() => navigation.navigate('VehicleForm', {})}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nicknameRow}>
                    <Text style={styles.nickname}>{vehicle.nickname}</Text>
                    {vehicle.id === activeId && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  {(vehicle.make || vehicle.model || vehicle.year) ? (
                    <Text style={styles.vehicleSub}>
                      {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.vehicleStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Rated Range</Text>
                  <Text style={styles.statValue}>
                    {vehicle.manufacturerRatedRange} {vehicle.rangeUnit}
                  </Text>
                </View>
                {vehicle.batteryCapacityKwh ? (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Battery</Text>
                    <Text style={styles.statValue}>{vehicle.batteryCapacityKwh} kWh</Text>
                  </View>
                ) : null}
                {vehicle.year ? (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Year</Text>
                    <Text style={styles.statValue}>{vehicle.year}</Text>
                  </View>
                ) : null}
              </View>

              {vehicle.notes ? (
                <Text style={styles.notes}>{vehicle.notes}</Text>
              ) : null}

              <View style={styles.actions}>
                {vehicle.id !== activeId && (
                  <TouchableOpacity
                    onPress={() => handleSetActive(vehicle.id)}
                    style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Set Active</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('VehicleForm', { vehicleId: vehicle.id })}
                  style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(vehicle)}
                  style={[styles.actionBtn, styles.actionBtnDestructive]}>
                  <Text style={styles.actionBtnDestructiveText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
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
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textMuted },
  vehicleCard: { gap: Spacing.sm },
  vehicleTop: { flexDirection: 'row', alignItems: 'flex-start' },
  nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nickname: { ...Typography.h3, color: Colors.textPrimary },
  activeBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  vehicleSub: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  vehicleStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statItem: {},
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  statValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  notes: { ...Typography.bodySmall, color: Colors.textSecondary, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnText: { ...Typography.bodySmall, color: Colors.textSecondary },
  actionBtnDestructive: { borderColor: Colors.error },
  actionBtnDestructiveText: { ...Typography.bodySmall, color: Colors.error },
});
