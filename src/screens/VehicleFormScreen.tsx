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

import { RootStackParamList, Vehicle } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import {
  getAllVehicles,
  saveVehicle,
  updateVehicle,
} from '../utils/storage';
import { validateVehicle } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'VehicleForm'>;

export function VehicleFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const editId = route.params?.vehicleId;

  const [nickname, setNickname] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [ratedRange, setRatedRange] = useState('');
  const [rangeUnit, setRangeUnit] = useState<'miles' | 'km'>('miles');
  const [batteryKwh, setBatteryKwh] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!editId) return;
      getAllVehicles().then(vehicles => {
        const v = vehicles.find(x => x.id === editId);
        if (!v) return;
        setNickname(v.nickname);
        setMake(v.make ?? '');
        setModel(v.model ?? '');
        setYear(v.year ? String(v.year) : '');
        setRatedRange(String(v.manufacturerRatedRange));
        setRangeUnit(v.rangeUnit);
        setBatteryKwh(v.batteryCapacityKwh ? String(v.batteryCapacityKwh) : '');
        setPurchaseDate(v.purchaseDate ?? '');
        setOdometer(v.currentOdometer !== undefined ? String(v.currentOdometer) : '');
        setNotes(v.notes ?? '');
      });
    }, [editId]),
  );

  async function handleSave() {
    const input: Partial<Vehicle> = {
      nickname: nickname.trim(),
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      manufacturerRatedRange: parseFloat(ratedRange),
      rangeUnit,
      batteryCapacityKwh: batteryKwh ? parseFloat(batteryKwh) : undefined,
      purchaseDate: purchaseDate.trim() || undefined,
      currentOdometer: odometer ? parseFloat(odometer) : undefined,
      notes: notes.trim() || undefined,
    };

    const validationErrors = validateVehicle(input);
    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach(e => { errMap[e.field] = e.message; });
      setErrors(errMap);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      if (editId) {
        await updateVehicle(editId, input as Partial<Vehicle>);
      } else {
        await saveVehicle({
          ...input as Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
          isActive: true,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>{editId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <FormInput
            label="Nickname"
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. My Tesla"
            error={errors.nickname}
            required
          />

          <FormInput
            label="Make"
            value={make}
            onChangeText={setMake}
            placeholder="e.g. Tesla"
          />

          <FormInput
            label="Model"
            value={model}
            onChangeText={setModel}
            placeholder="e.g. Model 3"
          />

          <FormInput
            label="Year"
            value={year}
            onChangeText={setYear}
            placeholder="e.g. 2022"
            keyboardType="number-pad"
            error={errors.year}
          />

          <FormInput
            label="Manufacturer Rated 100% Range"
            value={ratedRange}
            onChangeText={setRatedRange}
            placeholder="e.g. 330"
            keyboardType="decimal-pad"
            error={errors.manufacturerRatedRange}
            hint="Enter the full 100% range listed by the manufacturer"
            required
          />

          <Text style={styles.unitLabel}>Range Unit</Text>
          <View style={styles.unitRow}>
            {(['miles', 'km'] as const).map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => setRangeUnit(u)}
                style={[styles.unitBtn, rangeUnit === u && styles.unitBtnSelected]}>
                <Text style={[styles.unitBtnText, rangeUnit === u && styles.unitBtnTextSelected]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormInput
            label="Battery Capacity (kWh)"
            value={batteryKwh}
            onChangeText={setBatteryKwh}
            placeholder="e.g. 75"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Purchase Date"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
          />

          <FormInput
            label="Current Odometer"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 12000"
            keyboardType="decimal-pad"
            error={errors.currentOdometer}
          />

          <FormInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this vehicle..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />

          <Button
            label={saving ? 'Saving...' : editId ? 'Update Vehicle' : 'Add Vehicle'}
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
  unitLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  unitRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  unitBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  unitBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  unitBtnText: { ...Typography.body, color: Colors.textSecondary },
  unitBtnTextSelected: { color: Colors.primary, fontWeight: '600' },
  saveBtn: { marginTop: Spacing.md },
});
