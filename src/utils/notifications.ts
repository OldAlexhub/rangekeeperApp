import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { getReminderSettings, updateReminderSettings } from './storage';

const CHANNEL_ID = 'rangekeeper_reminders';
const NOTIFICATION_ID = 'daily_reminder';

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Range Reminders',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<string> {
  try {
    const settings = await notifee.getNotificationSettings();
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.AUTHORIZED:
        return 'authorized';
      case AuthorizationStatus.DENIED:
        return 'denied';
      case AuthorizationStatus.NOT_DETERMINED:
        return 'not_determined';
      default:
        return 'unknown';
    }
  } catch {
    return 'unknown';
  }
}

export async function scheduleDailyReminder(
  vehicleNickname: string,
  timeString: string,
): Promise<boolean> {
  try {
    await setupNotificationChannel();

    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return false;

    await notifee.cancelNotification(NOTIFICATION_ID);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: NOTIFICATION_ID,
        title: 'RangeKeeper EV',
        body: `Have you logged today's range for ${vehicleNickname}?`,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.DEFAULT,
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );

    await updateReminderSettings({
      lastScheduledAt: new Date().toISOString(),
      permissionStatus: 'authorized',
    });

    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
    await updateReminderSettings({ enabled: false });
  } catch {}
}

export async function rescheduleIfNeeded(vehicleNickname: string): Promise<void> {
  try {
    const settings = await getReminderSettings();
    if (!settings.enabled) return;
    await scheduleDailyReminder(vehicleNickname, settings.reminderTime);
  } catch {}
}
