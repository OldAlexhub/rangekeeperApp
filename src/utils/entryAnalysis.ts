import { ComputedEntry, RangeEntry, Vehicle } from '../types';
import { computeEntry, roundTo } from './calculations';

export interface EntryInsight {
  title: string;
  message: string;
  tone: 'info' | 'good' | 'warning';
}

export interface EntryAnalysis {
  entry: ComputedEntry;
  previousEntry?: ComputedEntry;
  recentAverage?: number;
  recentDifference?: number;
  previousDifference?: number;
  trendLabel: 'higher' | 'lower' | 'steady' | 'first_entry';
  confidenceLabel: 'Starter' | 'Useful' | 'Stronger';
  insights: EntryInsight[];
  tips: string[];
  chartData: { x: number; y: number }[];
}

function validEntriesForVehicle(vehicle: Vehicle, entries: RangeEntry[]): ComputedEntry[] {
  return entries
    .filter(e => e.vehicleId === vehicle.id)
    .map(e => computeEntry(e, vehicle))
    .filter(e => e.estimatedFullRange > 0)
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildEntryAnalysis(
  vehicle: Vehicle,
  selectedEntry: RangeEntry,
  allEntries: RangeEntry[],
): EntryAnalysis {
  const sorted = validEntriesForVehicle(vehicle, allEntries);
  const entryIndex = sorted.findIndex(e => e.id === selectedEntry.id);
  const entry =
    entryIndex >= 0 ? sorted[entryIndex] : computeEntry(selectedEntry, vehicle);
  const previousEntry = entryIndex > 0 ? sorted[entryIndex - 1] : undefined;
  const priorEntries = entryIndex > 0 ? sorted.slice(Math.max(0, entryIndex - 6), entryIndex) : [];
  const recentAverage = average(priorEntries.map(e => e.estimatedFullRange));
  const recentDifference =
    recentAverage !== undefined ? entry.estimatedFullRange - recentAverage : undefined;
  const previousDifference =
    previousEntry !== undefined ? entry.estimatedFullRange - previousEntry.estimatedFullRange : undefined;

  const steadyThreshold = vehicle.manufacturerRatedRange * 0.01;
  const trendLabel =
    previousDifference === undefined
      ? 'first_entry'
      : Math.abs(previousDifference) <= steadyThreshold
      ? 'steady'
      : previousDifference > 0
      ? 'higher'
      : 'lower';

  const confidenceLabel =
    sorted.length >= 12 ? 'Stronger' : sorted.length >= 5 ? 'Useful' : 'Starter';

  const insights: EntryInsight[] = [];

  if (entry.rangeStatus === 'above_rated') {
    insights.push({
      title: 'Above rated estimate',
      message: `This check-in estimates ${roundTo(entry.aboveRatedAmount, 1)} ${vehicle.rangeUnit} above the manufacturer rated range.`,
      tone: 'good',
    });
  } else if (entry.rangeStatus === 'below_rated') {
    insights.push({
      title: 'Below rated estimate',
      message: `This check-in estimates ${roundTo(entry.estimatedRangeLossPercent, 1)}% below the manufacturer rated range.`,
      tone: 'warning',
    });
  } else {
    insights.push({
      title: 'Near rated estimate',
      message: 'This check-in is close to the manufacturer rated range estimate.',
      tone: 'info',
    });
  }

  if (previousDifference !== undefined) {
    const direction = previousDifference >= 0 ? 'higher' : 'lower';
    insights.push({
      title: 'Compared to previous',
      message:
        Math.abs(previousDifference) <= steadyThreshold
          ? 'This estimate is steady compared with the previous check-in.'
          : `This estimate is ${roundTo(Math.abs(previousDifference), 1)} ${vehicle.rangeUnit} ${direction} than the previous check-in.`,
      tone:
        Math.abs(previousDifference) <= steadyThreshold
          ? 'info'
          : previousDifference > 0
          ? 'good'
          : 'warning',
    });
  }

  if (recentDifference !== undefined) {
    const recentThreshold = vehicle.manufacturerRatedRange * 0.02;
    if (Math.abs(recentDifference) > recentThreshold) {
      insights.push({
        title: 'Compared to your normal',
        message: `This entry is ${roundTo(Math.abs(recentDifference), 1)} ${vehicle.rangeUnit} ${recentDifference > 0 ? 'above' : 'below'} your recent average.`,
        tone: recentDifference > 0 ? 'good' : 'warning',
      });
    }
  }

  if (entry.temperature !== undefined) {
    insights.push({
      title: 'Temperature context',
      message: `Temperature was logged at ${entry.temperature}${entry.temperatureUnit ?? ''}. Compare entries at similar temperatures for cleaner range patterns.`,
      tone: 'info',
    });
  }

  if (entry.drivingContext && entry.drivingContext !== 'unknown') {
    insights.push({
      title: 'Driving context',
      message: `${entry.drivingContext} driving can change displayed range estimates. Compare it against similar context entries when possible.`,
      tone: 'info',
    });
  }

  const tips = [
    'Log at similar battery percentages when possible so comparisons are cleaner.',
    'Add temperature and driving context when a reading looks unusual.',
    'Use several entries before treating a range change as a real trend.',
  ];

  if (entry.batteryPercent < 20) {
    tips.unshift('Very low battery readings can be noisier. A mid-charge reading may be easier to compare.');
  } else if (entry.batteryPercent > 90) {
    tips.unshift('Near-full readings are useful, but compare them with similar high-charge entries.');
  }

  if (entry.temperature === undefined) {
    tips.unshift('Add temperature next time to help explain cold-weather or hot-weather range changes.');
  }

  const windowStart = Math.max(0, entryIndex - 5);
  const windowEnd = entryIndex >= 0 ? Math.min(sorted.length, entryIndex + 6) : sorted.length;
  const chartWindow = sorted.slice(windowStart, windowEnd);
  const firstDate =
    chartWindow.length > 0 ? new Date(chartWindow[0].entryDate).getTime() : Date.now();
  const chartData = chartWindow.map(e => ({
    x: (new Date(e.entryDate).getTime() - firstDate) / (1000 * 60 * 60 * 24),
    y: e.estimatedFullRange,
  }));

  return {
    entry,
    previousEntry,
    recentAverage,
    recentDifference,
    previousDifference,
    trendLabel,
    confidenceLabel,
    insights: insights.slice(0, 5),
    tips: tips.slice(0, 4),
    chartData,
  };
}
