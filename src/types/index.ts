export interface Vehicle {
  id: string;
  nickname: string;
  make?: string;
  model?: string;
  year?: number;
  manufacturerRatedRange: number;
  rangeUnit: 'miles' | 'km';
  batteryCapacityKwh?: number;
  purchaseDate?: string;
  currentOdometer?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RangeEntry {
  id: string;
  vehicleId: string;
  entryDate: string;
  batteryPercent: number;
  displayedRange: number;
  odometer?: number;
  temperature?: number;
  temperatureUnit?: 'F' | 'C';
  drivingContext?: 'city' | 'highway' | 'mixed' | 'unknown';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedEntry extends RangeEntry {
  estimatedFullRange: number;
  rangeDifference: number;
  estimatedRangeLoss: number;
  estimatedRangeLossPercent: number;
  aboveRatedAmount: number;
  aboveRatedPercent: number;
  rangeStatus: 'above_rated' | 'at_rated' | 'below_rated';
}

export interface ReminderSettings {
  enabled: boolean;
  reminderTime: string;
  activeVehicleId?: string;
  lastScheduledAt?: string;
  permissionStatus?: string;
}

export interface AppSettings {
  defaultUnit: 'miles' | 'km';
  themeMode: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastPoint {
  daysFromNow: number;
  label: string;
  estimatedRange: number;
}

export interface ForecastResult {
  vehicleId: string;
  dataPoints: number;
  confidenceLabel: 'Low' | 'Medium' | 'Higher';
  monthlyChangeMiles: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  currentEstimatedFullRange: number;
  forecasts: ForecastPoint[];
  canForecast: boolean;
  reason?: string;
}

export interface ExportMetadata {
  generatedAt: string;
  appName: string;
  appVersion: string;
  vehicleCount: number;
  entryCount: number;
  disclaimer: string;
}

export type RootStackParamList = {
  Main: undefined;
  VehicleForm: { vehicleId?: string };
  EntryForm: { entryId?: string; vehicleId?: string };
  EntryDetail: { entryId: string };
  Vehicles: undefined;
  Reports: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Forecast: undefined;
  Settings: undefined;
};
