import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, RangeEntry } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import {
  getAllVehicles,
  getActiveVehicle,
  saveRangeEntry,
  updateRangeEntry,
  getAllEntries,
} from '../utils/storage';
import {
  validateRangeEntry,
  calculateEstimatedFullRange,
  roundTo,
} from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'EntryForm'>;

const DRIVING_CONTEXTS = [
  { value: 'city', label: 'City' },
  { value: 'highway', label: 'Highway' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'unknown', label: 'Unknown' },
];

export function EntryFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const editEntryId = route.params?.entryId;
  const preselectedVehicleId = route.params?.vehicleId;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batteryPercent, setBatteryPercent] = useState<string>('');
  const [displayedRange, setDisplayedRange] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [temperatureUnit, setTemperatureUnit] = useState<'F' | 'C'>('F');
  const [drivingContext, setDrivingContext] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const all = await getAllVehicles();
        setVehicles(all);

        if (editEntryId) {
          const entries = await getAllEntries();
          const entry = entries.find(e => e.id === editEntryId);
          if (entry) {
            setSelectedVehicleId(entry.vehicleId);
            setEntryDate(entry.entryDate);
            setBatteryPercent(String(entry.batteryPercent));
            setDisplayedRange(String(entry.displayedRange));
            setOdometer(entry.odometer !== undefined ? String(entry.odometer) : '');
            setTemperature(entry.temperature !== undefined ? String(entry.temperature) : '');
            setTemperatureUnit(entry.temperatureUnit ?? 'F');
            setDrivingContext(entry.drivingContext ?? '');
            setNotes(entry.notes ?? '');
          }
        } else {
          const active = await getActiveVehicle();
          setSelectedVehicleId(preselectedVehicleId ?? active?.id ?? all[0]?.id ?? '');
        }
      }
      load();
    }, [editEntryId, preselectedVehicleId]),
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const bp = parseFloat(batteryPercent);
  const dr = parseFloat(displayedRange);
  const estimatedFull =
    !isNaN(bp) && bp > 0 && bp <= 100 && !isNaN(dr) && dr >= 0
      ? calculateEstimatedFullRange(bp, dr)
      : null;

  const mfr = selectedVehicle?.manufacturerRatedRange ?? 0;
  const liveStatus =
    estimatedFull !== null && mfr > 0
      ? estimatedFull > mfr * 1.01
        ? 'above'
        : estimatedFull < mfr * 0.99
        ? 'below'
        : 'at'
      : null;

  async function handleSave() {
    const input: Partial<RangeEntry> = {
      vehicleId: selectedVehicleId,
      entryDate,
      batteryPercent: parseFloat(batteryPercent),
      displayedRange: parseFloat(displayedRange),
      odometer: odometer ? parseFloat(odometer) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      temperatureUnit: temperature ? temperatureUnit : undefined,
      drivingContext: drivingContext as RangeEntry['drivingContext'] || undefined,
      notes: notes.trim() || undefined,
    };

    const validationErrors = validateRangeEntry(input);
    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach(e => { errMap[e.field] = e.message; });
      setErrors(errMap);
      return;
    }
    setErrors({});

    if (input.displayedRange === 0) {
      Alert.alert(
        'Zero Range',
        'Displayed range is 0. Do you want to save this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: () => doSave(input as Omit<RangeEntry, 'id' | 'createdAt' | 'updatedAt'>) },
        ],
      );
      return;
    }

    await doSave(input as Omit<RangeEntry, 'id' | 'createdAt' | 'updatedAt'>);
  }

  async function doSave(input: Omit<RangeEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    setSaving(true);
    try {
      if (editEntryId) {
        await updateRangeEntry(editEntryId, input);
      } else {
        await saveRangeEntry(input);
      }
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Range</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Add a vehicle first before logging range.</Text>
          <Button
            label="Add Vehicle"
            onPress={() => {
              navigation.goBack();
              navigation.navigate('VehicleForm', {});
            }}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editEntryId ? 'Edit Entry' : 'Log Range'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {success && (
            <Card style={styles.successBanner}>
              <Text style={styles.successText}>Saved successfully!</Text>
            </Card>
          )}

          {/* Vehicle Selector */}
          <Text style={styles.sectionLabel}>Vehicle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setSelectedVehicleId(v.id)}
                style={[
                  styles.vehicleChip,
                  selectedVehicleId === v.id && styles.vehicleChipSelected,
                ]}>
                <Text
                  style={[
                    styles.vehicleChipText,
                    selectedVehicleId === v.id && styles.vehicleChipTextSelected,
                  ]}>
                  {v.nickname}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.vehicleId ? <Text style={styles.errorText}>{errors.vehicleId}</Text> : null}

          <FormInput
            label="Entry Date"
            value={entryDate}
            onChangeText={setEntryDate}
            placeholder="YYYY-MM-DD"
            error={errors.entryDate}
            required
          />

          <FormInput
            label="Battery Percentage"
            value={batteryPercent}
            onChangeText={setBatteryPercent}
            placeholder="e.g. 50"
            keyboardType="decimal-pad"
            error={errors.batteryPercent}
            hint="Enter the current battery level shown by your vehicle"
            required
          />

          <FormInput
            label={`Displayed Range (${selectedVehicle?.rangeUnit ?? 'miles'})`}
            value={displayedRange}
            onChangeText={setDisplayedRange}
            placeholder="e.g. 180"
            keyboardType="decimal-pad"
            error={errors.displayedRange}
            hint="Enter the range estimate shown on your vehicle's display"
            required
          />

          {/* Live Calculation Preview */}
          {estimatedFull !== null && selectedVehicle && (
            <Card style={styles.previewCard} elevated>
              <Text style={styles.previewTitle}>Live Estimate</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Estimated 100% Range</Text>
                <Text style={styles.previewValue}>
                  {roundTo(estimatedFull, 1)} {selectedVehicle.rangeUnit}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Manufacturer Rated</Text>
                <Text style={styles.previewValue}>
                  {selectedVehicle.manufacturerRatedRange} {selectedVehicle.rangeUnit}
                </Text>
              </View>
              {liveStatus === 'above' && (
                <>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Above rated by</Text>
                    <Text style={[styles.previewValue, { color: Colors.success }]}>
                      +{roundTo(estimatedFull - selectedVehicle.manufacturerRatedRange, 1)} {selectedVehicle.rangeUnit}
                    </Text>
                  </View>
                  <Text style={styles.previewNote}>
                    Current estimate is above rated range. This may reflect driving conditions, recent efficiency, vehicle estimate behavior, or data entry differences.
                  </Text>
                </>
              )}
              {liveStatus === 'below' && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Estimated loss</Text>
                  <Text style={[styles.previewValue, { color: Colors.error }]}>
                    -{roundTo(selectedVehicle.manufacturerRatedRange - estimatedFull, 1)} {selectedVehicle.rangeUnit} (
                    {roundTo(((selectedVehicle.manufacturerRatedRange - estimatedFull) / selectedVehicle.manufacturerRatedRange) * 100, 1)}%)
                  </Text>
                </View>
              )}
              {liveStatus === 'at' && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Status</Text>
                  <Text style={[styles.previewValue, { color: Colors.primary }]}>At rated estimate</Text>
                </View>
              )}
            </Card>
          )}

          {/* Optional fields */}
          <Text style={styles.optionalHeader}>Optional Details</Text>

          <FormInput
            label="Odometer"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 15000"
            keyboardType="decimal-pad"
            error={errors.odometer}
          />

          <View style={styles.tempRow}>
            <FormInput
              label="Temperature"
              value={temperature}
              onChangeText={setTemperature}
              placeholder="e.g. 72"
              keyboardType="decimal-pad"
              style={{ flex: 1 }}
            />
            <View style={styles.tempUnitRow}>
              {(['F', 'C'] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setTemperatureUnit(u)}
                  style={[
                    styles.unitBtn,
                    temperatureUnit === u && styles.unitBtnSelected,
                  ]}>
                  <Text
                    style={[
                      styles.unitBtnText,
                      temperatureUnit === u && styles.unitBtnTextSelected,
                    ]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Driving Context</Text>
          <View style={styles.contextRow}>
            {DRIVING_CONTEXTS.map(ctx => (
              <TouchableOpacity
                key={ctx.value}
                onPress={() => setDrivingContext(drivingContext === ctx.value ? '' : ctx.value)}
                style={[
                  styles.contextChip,
                  drivingContext === ctx.value && styles.contextChipSelected,
                ]}>
                <Text
                  style={[
                    styles.contextChipText,
                    drivingContext === ctx.value && styles.contextChipTextSelected,
                  ]}>
                  {ctx.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this reading..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />

          <Button
            label={saving ? 'Saving...' : editEntryId ? 'Update Entry' : 'Save Check-In'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backBtnText: { ...Typography.body, color: Colors.primary },
  title: { ...Typography.h4, color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  successBanner: {
    backgroundColor: Colors.successMuted,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  successText: { ...Typography.body, color: Colors.success },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  vehicleScroll: { marginBottom: Spacing.md },
  vehicleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  vehicleChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  vehicleChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  vehicleChipTextSelected: { color: Colors.primary, fontWeight: '600' },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.sm },
  previewCard: { marginBottom: Spacing.md },
  previewTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  previewLabel: { ...Typography.body, color: Colors.textSecondary },
  previewValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  previewNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    lineHeight: 17,
  },
  optionalHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  tempRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  tempUnitRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 24,
  },
  unitBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  unitBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  unitBtnText: { ...Typography.bodySmall, color: Colors.textSecondary },
  unitBtnTextSelected: { color: Colors.primary },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  contextChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  contextChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  contextChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  contextChipTextSelected: { color: Colors.primary },
  saveBtn: { marginTop: Spacing.md },
});
