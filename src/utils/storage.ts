import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, RangeEntry, AppSettings, ReminderSettings } from '../types';

const KEYS = {
  VEHICLES: 'rk_vehicles',
  ENTRIES: 'rk_entries',
  SETTINGS: 'rk_settings',
  REMINDER: 'rk_reminder',
  ACTIVE_VEHICLE: 'rk_active_vehicle',
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage errors are non-fatal but silently logged
  }
}

// ---- Vehicles ----

export async function getAllVehicles(): Promise<Vehicle[]> {
  return loadJson<Vehicle[]>(KEYS.VEHICLES, []);
}

export async function saveVehicle(input: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
  const vehicles = await getAllVehicles();
  const vehicle: Vehicle = {
    ...input,
    id: generateId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  vehicles.push(vehicle);
  await saveJson(KEYS.VEHICLES, vehicles);

  if (vehicles.length === 1) {
    await setActiveVehicleId(vehicle.id);
  }

  return vehicle;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  const vehicles = await getAllVehicles();
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx === -1) return null;
  vehicles[idx] = { ...vehicles[idx], ...updates, updatedAt: nowIso() };
  await saveJson(KEYS.VEHICLES, vehicles);
  return vehicles[idx];
}

export async function deleteVehicleAndEntries(id: string): Promise<void> {
  const vehicles = await getAllVehicles();
  const remaining = vehicles.filter(v => v.id !== id);
  await saveJson(KEYS.VEHICLES, remaining);

  const entries = await getAllEntries();
  const filteredEntries = entries.filter(e => e.vehicleId !== id);
  await saveJson(KEYS.ENTRIES, filteredEntries);

  const activeId = await getActiveVehicleId();
  if (activeId === id) {
    const next = remaining.find(v => v.isActive) ?? remaining[0] ?? null;
    await setActiveVehicleId(next ? next.id : null);
  }
}

export async function getActiveVehicleId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.ACTIVE_VEHICLE);
  } catch {
    return null;
  }
}

export async function setActiveVehicleId(id: string | null): Promise<void> {
  try {
    if (id === null) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_VEHICLE);
    } else {
      await AsyncStorage.setItem(KEYS.ACTIVE_VEHICLE, id);
    }
  } catch {}
}

export async function getActiveVehicle(): Promise<Vehicle | null> {
  const id = await getActiveVehicleId();
  if (!id) return null;
  const vehicles = await getAllVehicles();
  return vehicles.find(v => v.id === id) ?? null;
}

// ---- Range Entries ----

export async function getAllEntries(): Promise<RangeEntry[]> {
  return loadJson<RangeEntry[]>(KEYS.ENTRIES, []);
}

export async function getEntriesForVehicle(vehicleId: string): Promise<RangeEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.vehicleId === vehicleId);
}

export async function getLatestEntryForVehicle(vehicleId: string): Promise<RangeEntry | null> {
  const entries = await getEntriesForVehicle(vehicleId);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0];
}

export async function saveRangeEntry(input: Omit<RangeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<RangeEntry> {
  const entries = await getAllEntries();
  const entry: RangeEntry = {
    ...input,
    id: generateId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  entries.push(entry);
  await saveJson(KEYS.ENTRIES, entries);
  return entry;
}

export async function updateRangeEntry(id: string, updates: Partial<RangeEntry>): Promise<RangeEntry | null> {
  const entries = await getAllEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates, updatedAt: nowIso() };
  await saveJson(KEYS.ENTRIES, entries);
  return entries[idx];
}

export async function deleteRangeEntry(id: string): Promise<void> {
  const entries = await getAllEntries();
  await saveJson(KEYS.ENTRIES, entries.filter(e => e.id !== id));
}

// ---- Settings ----

const DEFAULT_SETTINGS: AppSettings = {
  defaultUnit: 'miles',
  themeMode: 'system',
  hasCompletedOnboarding: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getAppSettings(): Promise<AppSettings> {
  return loadJson<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated = { ...current, ...updates, updatedAt: nowIso() };
  await saveJson(KEYS.SETTINGS, updated);
  return updated;
}

// ---- Reminder Settings ----

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  reminderTime: '18:00',
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  return loadJson<ReminderSettings>(KEYS.REMINDER, DEFAULT_REMINDER);
}

export async function updateReminderSettings(updates: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const current = await getReminderSettings();
  const updated = { ...current, ...updates };
  await saveJson(KEYS.REMINDER, updated);
  return updated;
}

// ---- Reset ----

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.VEHICLES,
    KEYS.ENTRIES,
    KEYS.SETTINGS,
    KEYS.REMINDER,
    KEYS.ACTIVE_VEHICLE,
  ]);
}
