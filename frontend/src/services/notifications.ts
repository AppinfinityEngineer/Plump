// Notification scaffolding. Opt-in only. Safe no-ops where unsupported.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const DAILY_SAVE_REMINDER_ID = 'plump.daily-save-reminder';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (!settings.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function scheduleCadenceReminder(message: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_SAVE_REMINDER_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_SAVE_REMINDER_ID,
      content: {
        title: 'Plump',
        body: message,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
  } catch {
    // no-op
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // no-op
  }
}

export const NOTIFICATION_COPY = {
  todayEnvelope: (amount: string) => `Today's envelope is ${amount}. Tiny save, chubby reward.`,
  streak: `Your Plump misses today's thunk.`,
  oneAway: `You're one save away from a rounder mascot.`,
};
