import { Share } from 'react-native';
import { Vehicle, RangeEntry, ComputedEntry } from '../types';
import { computeEntry, roundTo } from './calculations';
import { buildForecast } from './forecast';

const APP_NAME = 'RangeKeeper EV';
const APP_VERSION = '1.0.0';
const DISCLAIMER =
  'RangeKeeper EV provides estimates based on manually entered data. It does not diagnose battery health. Actual EV range may vary.';

function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(vehicles: Vehicle[], entries: RangeEntry[]): string {
  const header = [
    'Vehicle Nickname',
    'Entry Date',
    'Battery %',
    'Displayed Range',
    'Unit',
    'Estimated Full Range',
    'Manufacturer Rated Range',
    'Estimated Range Loss',
    'Range Loss %',
    'Above Rated Amount',
    'Above Rated %',
    'Status',
    'Odometer',
    'Temperature',
    'Temp Unit',
    'Driving Context',
    'Notes',
  ]
    .map(escapeCSV)
    .join(',');

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  const rows = entries.map(entry => {
    const vehicle = vehicleMap.get(entry.vehicleId);
    if (!vehicle) {
      return [
        '',
        entry.entryDate,
        entry.batteryPercent,
        entry.displayedRange,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        entry.odometer ?? '',
        entry.temperature ?? '',
        entry.temperatureUnit ?? '',
        entry.drivingContext ?? '',
        entry.notes ?? '',
      ]
        .map(escapeCSV)
        .join(',');
    }

    const computed = computeEntry(entry, vehicle);

    return [
      vehicle.nickname,
      entry.entryDate,
      entry.batteryPercent,
      entry.displayedRange,
      vehicle.rangeUnit,
      roundTo(computed.estimatedFullRange, 1),
      vehicle.manufacturerRatedRange,
      roundTo(computed.estimatedRangeLoss, 1),
      roundTo(computed.estimatedRangeLossPercent, 2),
      roundTo(computed.aboveRatedAmount, 1),
      roundTo(computed.aboveRatedPercent, 2),
      computed.rangeStatus,
      entry.odometer ?? '',
      entry.temperature ?? '',
      entry.temperatureUnit ?? '',
      entry.drivingContext ?? '',
      entry.notes ?? '',
    ]
      .map(escapeCSV)
      .join(',');
  });

  return [header, ...rows].join('\n');
}

export function exportJson(vehicles: Vehicle[], entries: RangeEntry[]): string {
  const payload = {
    appName: APP_NAME,
    appVersion: APP_VERSION,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    vehicleCount: vehicles.length,
    entryCount: entries.length,
    vehicles,
    entries,
  };
  return JSON.stringify(payload, null, 2);
}

export function buildTextReport(vehicles: Vehicle[], entries: RangeEntry[]): string {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let report = `${APP_NAME} - Range Report\n`;
  report += `Generated: ${now}\n`;
  report += `${'='.repeat(50)}\n\n`;

  if (vehicles.length === 0) {
    report += 'No vehicles found.\n';
    return report;
  }

  for (const vehicle of vehicles) {
    const vehicleEntries = entries.filter(e => e.vehicleId === vehicle.id);
    const sorted = [...vehicleEntries].sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
    );

    report += `Vehicle: ${vehicle.nickname}\n`;
    if (vehicle.make || vehicle.model || vehicle.year) {
      report += `  ${[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}\n`;
    }
    report += `  Manufacturer Rated Range: ${vehicle.manufacturerRatedRange} ${vehicle.rangeUnit}\n`;
    report += `  Total Check-ins: ${vehicleEntries.length}\n`;

    if (sorted.length > 0) {
      const latest = sorted[0];
      const computed = computeEntry(latest, vehicle);
      report += `  Latest Check-in: ${latest.entryDate}\n`;
      report += `    Battery: ${latest.batteryPercent}%\n`;
      report += `    Displayed Range: ${latest.displayedRange} ${vehicle.rangeUnit}\n`;
      report += `    Estimated Full Range: ${roundTo(computed.estimatedFullRange, 1)} ${vehicle.rangeUnit}\n`;

      if (computed.rangeStatus === 'above_rated') {
        report += `    Status: Above rated estimate (+${roundTo(computed.aboveRatedAmount, 1)} ${vehicle.rangeUnit})\n`;
      } else if (computed.rangeStatus === 'below_rated') {
        report += `    Status: Below rated estimate (-${roundTo(computed.estimatedRangeLoss, 1)} ${vehicle.rangeUnit}, ${roundTo(computed.estimatedRangeLossPercent, 1)}% below)\n`;
      } else {
        report += `    Status: At rated estimate\n`;
      }

      const computedAll = vehicleEntries
        .map(e => computeEntry(e, vehicle))
        .filter(c => c.estimatedFullRange > 0);

      if (computedAll.length > 0) {
        const avgFull =
          computedAll.reduce((sum, c) => sum + c.estimatedFullRange, 0) / computedAll.length;
        report += `  Average Estimated Full Range: ${roundTo(avgFull, 1)} ${vehicle.rangeUnit}\n`;
      }

      const forecast = buildForecast(vehicle, vehicleEntries);
      if (forecast.canForecast) {
        report += `  Trend: ${forecast.trendDirection} (${roundTo(forecast.monthlyChangeMiles, 2)} ${vehicle.rangeUnit}/month)\n`;
        report += `  Forecast (30 days): ${roundTo(forecast.forecasts[0].estimatedRange, 1)} ${vehicle.rangeUnit}\n`;
        report += `  Forecast (12 months): ${roundTo(forecast.forecasts[3].estimatedRange, 1)} ${vehicle.rangeUnit}\n`;
      }
    }

    report += '\n';
  }

  report += `${'='.repeat(50)}\n`;
  report += `${DISCLAIMER}\n`;

  return report;
}

export async function shareCsv(vehicles: Vehicle[], entries: RangeEntry[]): Promise<void> {
  const csv = exportCsv(vehicles, entries);
  await Share.share({
    title: 'RangeKeeper EV - CSV Export',
    message: csv,
  });
}

export async function shareJson(vehicles: Vehicle[], entries: RangeEntry[]): Promise<void> {
  const json = exportJson(vehicles, entries);
  await Share.share({
    title: 'RangeKeeper EV - JSON Export',
    message: json,
  });
}

export async function shareTextReport(vehicles: Vehicle[], entries: RangeEntry[]): Promise<void> {
  const report = buildTextReport(vehicles, entries);
  await Share.share({
    title: 'RangeKeeper EV - Range Report',
    message: report,
  });
}
