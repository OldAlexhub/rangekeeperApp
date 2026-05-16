import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, Vehicle, AppSettings, ReminderSettings } from '../types';
import { Colors, Spacing, Typography, Radius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  getAppSettings,
  updateAppSettings,
  getReminderSettings,
  updateReminderSettings,
  getAllVehicles,
  getActiveVehicle,
  resetAllData,
} from '../utils/storage';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../utils/notifications';

const APP_VERSION = '1.0.0';
const APP_NAME = 'RangeKeeper EV';
const DEVELOPER = 'Old Alex Hub';

const PRIVACY_TEXT = `RangeKeeper EV is a private, offline EV range journal.

This app does not collect, transmit, or share any personal data. All data you enter (vehicle profiles, range check-ins, settings, and reminders) is stored only on your device.

The app does not require an account, does not use a backend server, does not use analytics, and does not display ads.

Notification permission is used only for optional local daily reminders. You can disable reminders at any time.

To delete all your data: use "Reset All Data" below, or uninstall the app.

RangeKeeper EV is not a battery diagnostic tool and does not measure actual battery capacity. Estimates are based on manually entered data. Actual range may vary.`;

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [reminder, setReminder] = useState<ReminderSettings | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    setLoading(true);
    const s = await getAppSettings();
    const r = await getReminderSettings();
    const v = await getAllVehicles();
    const av = await getActiveVehicle();
    const ps = await getNotificationPermissionStatus();
    setSettings(s);
    setReminder(r);
    setVehicles(v);
    setActiveVehicle(av);
    setPermissionStatus(ps);
    setLoading(false);
  }

  async function handleToggleReminder(value: boolean) {
    if (!reminder) return;

    if (value) {
      if (!activeVehicle) {
        Alert.alert('No Vehicle', 'Add a vehicle first before enabling reminders.');
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Notification permission was not granted. Please enable it in your device settings to use daily reminders.',
        );
        await updateReminderSettings({ enabled: false, permissionStatus: 'denied' });
        setReminder(r => r ? { ...r, enabled: false, permissionStatus: 'denied' } : r);
        setPermissionStatus('denied');
        return;
      }

      const success = await scheduleDailyReminder(activeVehicle.nickname, reminder.reminderTime);
      if (!success) {
        Alert.alert('Reminder Error', 'Could not schedule reminder. Please try again.');
        return;
      }
      const updated = await updateReminderSettings({ enabled: true, permissionStatus: 'authorized', activeVehicleId: activeVehicle.id });
      setReminder(updated);
      setPermissionStatus('authorized');
    } else {
      await cancelDailyReminder();
      const updated = await updateReminderSettings({ enabled: false });
      setReminder(updated);
    }
  }

  async function handleReminderTimeChange(time: string) {
    if (!reminder) return;
    const updated = await updateReminderSettings({ reminderTime: time });
    setReminder(updated);
    if (reminder.enabled && activeVehicle) {
      await scheduleDailyReminder(activeVehicle.nickname, time);
    }
  }

  async function handleDefaultUnit(unit: 'miles' | 'km') {
    const updated = await updateAppSettings({ defaultUnit: unit });
    setSettings(updated);
  }

  function handleShowPrivacy() {
    Alert.alert('Privacy Policy', PRIVACY_TEXT, [{ text: 'OK' }]);
  }

  function handleResetData() {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your vehicles, range entries, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            await cancelDailyReminder();
            await load();
            Alert.alert('Reset Complete', 'All data has been deleted.');
          },
        },
      ],
    );
  }

  const timeOptions = ['06:00', '07:00', '08:00', '09:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  if (loading || !settings || !reminder) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>Settings</Text></View>
        <View style={styles.center}><Text style={styles.muted}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Default Unit */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Default Range Unit</Text>
          <View style={styles.unitRow}>
            {(['miles', 'km'] as const).map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => handleDefaultUnit(u)}
                style={[styles.unitBtn, settings.defaultUnit === u && styles.unitBtnActive]}>
                <Text style={[styles.unitBtnText, settings.defaultUnit === u && styles.unitBtnTextActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Reminders */}
        <Text style={styles.sectionLabel}>Daily Reminders</Text>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Daily Reminder</Text>
              <Text style={styles.settingDesc}>
                {activeVehicle
                  ? `Remind me to log range for ${activeVehicle.nickname}`
                  : 'Add a vehicle to enable reminders'}
              </Text>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
              disabled={!activeVehicle}
            />
          </View>

          {permissionStatus === 'denied' && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>
                Notification permission is denied. Enable it in your device Settings app to use daily reminders.
              </Text>
            </View>
          )}

          {reminder.enabled && (
            <>
              <Text style={styles.settingSubLabel}>Reminder Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeRow}>
                  {timeOptions.map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => handleReminderTimeChange(t)}
                      style={[styles.timeChip, reminder.reminderTime === t && styles.timeChipActive]}>
                      <Text style={[styles.timeChipText, reminder.reminderTime === t && styles.timeChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </Card>

        {/* Vehicles */}
        <Text style={styles.sectionLabel}>Vehicles</Text>
        <Card style={styles.card}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Vehicles')}
            style={styles.linkRow}>
            <View>
              <Text style={styles.linkText}>Manage Vehicles</Text>
              <Text style={styles.linkSub}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} saved</Text>
            </View>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={() => navigation.navigate('VehicleForm', {})}
            style={styles.linkRow}>
            <Text style={styles.linkText}>Add New Vehicle</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Export */}
        <Text style={styles.sectionLabel}>Export Data</Text>
        <Card style={styles.card}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Reports')}
            style={styles.linkRow}>
            <View>
              <Text style={styles.linkText}>Reports & Export</Text>
              <Text style={styles.linkSub}>CSV, JSON, or text summary</Text>
            </View>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <Card style={styles.card}>
          <TouchableOpacity onPress={handleShowPrivacy} style={styles.linkRow}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.privacySummary}>
            <Text style={styles.privacyItem}>No data collected by developer</Text>
            <Text style={styles.privacyItem}>No account required</Text>
            <Text style={styles.privacyItem}>No backend or cloud sync</Text>
            <Text style={styles.privacyItem}>No ads or analytics</Text>
            <Text style={styles.privacyItem}>All data stored locally on your device</Text>
          </View>
        </Card>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>Data Management</Text>
        <Card style={styles.card}>
          <TouchableOpacity onPress={handleResetData} style={styles.dangerRow}>
            <Text style={styles.dangerTitle}>Reset All Data</Text>
            <Text style={styles.dangerDesc}>
              Delete all vehicles, range entries, and settings. Cannot be undone.
            </Text>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>{APP_NAME}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Developer</Text>
            <Text style={styles.aboutValue}>{DEVELOPER}</Text>
          </View>
        </Card>

        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            RangeKeeper EV is not a battery diagnostic tool and does not measure actual battery capacity. Estimates are based on manually entered data. Actual range may vary due to temperature, driving style, terrain, tire condition, charging habits, vehicle software, and manufacturer range calculation methods.
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
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.body, color: Colors.textMuted },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  card: { gap: Spacing.sm },
  cardTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  unitRow: { flexDirection: 'row', gap: Spacing.sm },
  unitBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  unitBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  unitBtnText: { ...Typography.body, color: Colors.textSecondary },
  unitBtnTextActive: { color: Colors.primary, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  settingDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  settingSubLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  permissionWarning: {
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  permissionWarningText: { ...Typography.caption, color: Colors.warning, lineHeight: 17 },
  timeRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  timeChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  timeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  timeChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  timeChipTextActive: { color: Colors.primary, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  linkText: { ...Typography.body, color: Colors.textPrimary },
  linkSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  linkChevron: { ...Typography.h3, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  privacySummary: { gap: 4 },
  privacyItem: { ...Typography.bodySmall, color: Colors.textSecondary },
  dangerRow: { paddingVertical: Spacing.xs },
  dangerTitle: { ...Typography.body, color: Colors.error, fontWeight: '600', marginBottom: 4 },
  dangerDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  aboutLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  aboutValue: { ...Typography.bodySmall, color: Colors.textPrimary },
  disclaimerCard: { backgroundColor: Colors.surfaceElevated, marginTop: Spacing.sm },
  disclaimerText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 17 },
});
