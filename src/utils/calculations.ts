import { RangeEntry, Vehicle, ComputedEntry } from '../types';

export function calculateEstimatedFullRange(
  batteryPercent: number,
  displayedRange: number,
): number {
  if (batteryPercent <= 0 || batteryPercent > 100) {
    return 0;
  }
  return displayedRange / (batteryPercent / 100);
}

export function calculateRangeDifference(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): number {
  return estimatedFullRange - manufacturerRatedRange;
}

export function calculateRangeLoss(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): number {
  return Math.max(manufacturerRatedRange - estimatedFullRange, 0);
}

export function calculateRangeLossPercent(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): number {
  if (manufacturerRatedRange <= 0) return 0;
  return Math.max(
    ((manufacturerRatedRange - estimatedFullRange) / manufacturerRatedRange) * 100,
    0,
  );
}

export function calculateAboveRatedAmount(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): number {
  return Math.max(estimatedFullRange - manufacturerRatedRange, 0);
}

export function calculateAboveRatedPercent(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): number {
  if (manufacturerRatedRange <= 0) return 0;
  return Math.max(
    ((estimatedFullRange - manufacturerRatedRange) / manufacturerRatedRange) * 100,
    0,
  );
}

export function classifyRangeStatus(
  manufacturerRatedRange: number,
  estimatedFullRange: number,
): 'above_rated' | 'at_rated' | 'below_rated' {
  const threshold = manufacturerRatedRange * 0.01;
  const diff = estimatedFullRange - manufacturerRatedRange;
  if (diff > threshold) return 'above_rated';
  if (diff < -threshold) return 'below_rated';
  return 'at_rated';
}

export function computeEntry(entry: RangeEntry, vehicle: Vehicle): ComputedEntry {
  const estimatedFullRange = calculateEstimatedFullRange(
    entry.batteryPercent,
    entry.displayedRange,
  );
  const rangeDifference = calculateRangeDifference(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );
  const estimatedRangeLoss = calculateRangeLoss(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );
  const estimatedRangeLossPercent = calculateRangeLossPercent(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );
  const aboveRatedAmount = calculateAboveRatedAmount(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );
  const aboveRatedPercent = calculateAboveRatedPercent(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );
  const rangeStatus = classifyRangeStatus(
    vehicle.manufacturerRatedRange,
    estimatedFullRange,
  );

  return {
    ...entry,
    estimatedFullRange,
    rangeDifference,
    estimatedRangeLoss,
    estimatedRangeLossPercent,
    aboveRatedAmount,
    aboveRatedPercent,
    rangeStatus,
  };
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatRange(value: number, unit: string, decimals = 1): string {
  return `${roundTo(value, decimals)} ${unit}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${roundTo(value, decimals)}%`;
}

export interface VehicleValidationError {
  field: string;
  message: string;
}

export function validateVehicle(input: Partial<Vehicle>): VehicleValidationError[] {
  const errors: VehicleValidationError[] = [];
  const currentYear = new Date().getFullYear();

  if (!input.nickname || input.nickname.trim() === '') {
    errors.push({ field: 'nickname', message: 'Nickname is required.' });
  }
  if (!input.manufacturerRatedRange || input.manufacturerRatedRange <= 0) {
    errors.push({
      field: 'manufacturerRatedRange',
      message: 'Manufacturer rated range must be greater than 0.',
    });
  }
  if (input.rangeUnit && !['miles', 'km'].includes(input.rangeUnit)) {
    errors.push({ field: 'rangeUnit', message: 'Unit must be miles or km.' });
  }
  if (input.year !== undefined && input.year !== null) {
    if (input.year < 1996 || input.year > currentYear + 1) {
      errors.push({
        field: 'year',
        message: `Year must be between 1996 and ${currentYear + 1}.`,
      });
    }
  }
  if (input.currentOdometer !== undefined && input.currentOdometer !== null) {
    if (input.currentOdometer < 0) {
      errors.push({ field: 'currentOdometer', message: 'Odometer cannot be negative.' });
    }
  }

  return errors;
}

export interface EntryValidationError {
  field: string;
  message: string;
}

export function validateRangeEntry(input: Partial<RangeEntry>): EntryValidationError[] {
  const errors: EntryValidationError[] = [];

  if (!input.vehicleId) {
    errors.push({ field: 'vehicleId', message: 'Vehicle is required.' });
  }
  if (input.batteryPercent === undefined || input.batteryPercent === null) {
    errors.push({ field: 'batteryPercent', message: 'Battery percentage is required.' });
  } else if (input.batteryPercent <= 0) {
    errors.push({ field: 'batteryPercent', message: 'Battery percentage must be greater than 0.' });
  } else if (input.batteryPercent > 100) {
    errors.push({ field: 'batteryPercent', message: 'Battery percentage cannot exceed 100.' });
  }
  if (input.displayedRange === undefined || input.displayedRange === null) {
    errors.push({ field: 'displayedRange', message: 'Displayed range is required.' });
  } else if (input.displayedRange < 0) {
    errors.push({ field: 'displayedRange', message: 'Displayed range cannot be negative.' });
  }
  if (!input.entryDate) {
    errors.push({ field: 'entryDate', message: 'Date is required.' });
  } else {
    const d = new Date(input.entryDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'entryDate', message: 'Date is invalid.' });
    }
  }
  if (input.odometer !== undefined && input.odometer !== null) {
    if (input.odometer < 0) {
      errors.push({ field: 'odometer', message: 'Odometer cannot be negative.' });
    }
  }

  return errors;
}
