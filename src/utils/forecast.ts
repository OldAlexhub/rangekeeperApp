import { RangeEntry, Vehicle, ForecastResult, ForecastPoint } from '../types';
import { calculateEstimatedFullRange } from './calculations';

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function buildForecast(vehicle: Vehicle, entries: RangeEntry[]): ForecastResult {
  if (entries.length < 3) {
    return {
      vehicleId: vehicle.id,
      dataPoints: entries.length,
      confidenceLabel: 'Low',
      monthlyChangeMiles: 0,
      trendDirection: 'stable',
      currentEstimatedFullRange: 0,
      forecasts: [],
      canForecast: false,
      reason:
        entries.length === 0
          ? 'Add range check-ins to unlock forecasting.'
          : 'Add at least 3 range check-ins to generate a basic trend.',
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
  );

  const firstDate = new Date(sorted[0].entryDate).getTime();
  const xs: number[] = [];
  const ys: number[] = [];

  for (const entry of sorted) {
    const daysSinceFirst =
      (new Date(entry.entryDate).getTime() - firstDate) / (1000 * 60 * 60 * 24);
    const estimatedFull = calculateEstimatedFullRange(entry.batteryPercent, entry.displayedRange);
    if (estimatedFull > 0) {
      xs.push(daysSinceFirst);
      ys.push(estimatedFull);
    }
  }

  if (xs.length < 3) {
    return {
      vehicleId: vehicle.id,
      dataPoints: entries.length,
      confidenceLabel: 'Low',
      monthlyChangeMiles: 0,
      trendDirection: 'stable',
      currentEstimatedFullRange: ys[ys.length - 1] ?? 0,
      forecasts: [],
      canForecast: false,
      reason: 'Not enough valid data points to generate a trend.',
    };
  }

  const { slope, intercept } = linearRegression(xs, ys);

  const lastDays = xs[xs.length - 1];
  const currentEstimatedFullRange = Math.max(slope * lastDays + intercept, 0);
  const monthlyChangeMiles = slope * 30;

  const stableThreshold = vehicle.manufacturerRatedRange * 0.001;
  let trendDirection: 'improving' | 'stable' | 'declining';
  if (Math.abs(monthlyChangeMiles) < stableThreshold) {
    trendDirection = 'stable';
  } else if (monthlyChangeMiles > 0) {
    trendDirection = 'improving';
  } else {
    trendDirection = 'declining';
  }

  let confidenceLabel: 'Low' | 'Medium' | 'Higher';
  if (entries.length >= 15) {
    confidenceLabel = 'Higher';
  } else if (entries.length >= 6) {
    confidenceLabel = 'Medium';
  } else {
    confidenceLabel = 'Low';
  }

  const forecastDays = [30, 90, 180, 365];
  const forecasts: ForecastPoint[] = forecastDays.map(days => ({
    daysFromNow: days,
    label:
      days === 30
        ? '30 days'
        : days === 90
        ? '3 months'
        : days === 180
        ? '6 months'
        : '12 months',
    estimatedRange: Math.max(slope * (lastDays + days) + intercept, 0),
  }));

  return {
    vehicleId: vehicle.id,
    dataPoints: entries.length,
    confidenceLabel,
    monthlyChangeMiles,
    trendDirection,
    currentEstimatedFullRange,
    forecasts,
    canForecast: true,
  };
}
