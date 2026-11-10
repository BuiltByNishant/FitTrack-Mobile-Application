// All notification scheduling lives here. The app uses one repeating LOCAL notification (no push server).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getPref, setPref } from '../repo/preferences';

export const CHANNEL_ID = 'workout-reminders';

// The four times offered in Settings.
export const REMINDER_TIMES = [
  { id: '07:00', label: '7:00 AM', hour: 7, minute: 0 },
  { id: '09:00', label: '9:00 AM', hour: 9, minute: 0 },
  { id: '18:00', label: '6:00 PM', hour: 18, minute: 0 },
  { id: '20:00', label: '8:00 PM', hour: 20, minute: 0 },
];

export function timeLabel(id) {
  return REMINDER_TIMES.find((t) => t.id === id)?.label ?? id;
}

// Decides how a notification is shown while the app is open. Call once at startup.
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Workout reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function hasPermission() {
  const current = await Notifications.getPermissionsAsync();
  return !!current.granted;
}

// Asks for permission only when the person turns the reminder on.
async function requestPermission() {
  await ensureChannel(); // Android needs a channel before the permission prompt can appear
  if (await hasPermission()) return true;
  const result = await Notifications.requestPermissionsAsync();
  return !!result.granted;
}

async function cancelStored() {
  const id = await getPref('reminderNotificationId', '');
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // already gone, nothing to cancel
    }
  }
}

async function schedule(timeId) {
  const time = REMINDER_TIMES.find((t) => t.id === timeId) ?? REMINDER_TIMES[2];
  await ensureChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to train',
      body: "Open FitTrack and log today's workout.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function getReminderState() {
  const enabled = (await getPref('reminderEnabled', '0')) === '1';
  const time = await getPref('reminderTime', '18:00');
  return { enabled, time };
}

// Turns the reminder on (or moves it to a new time). Replaces any existing schedule.
// Returns { ok: true } or { ok: false, reason: 'denied' }.
export async function enableReminder(timeId) {
  const granted = await requestPermission();
  if (!granted) {
    await cancelStored();
    await setPref('reminderEnabled', '0');
    await setPref('reminderNotificationId', '');
    return { ok: false, reason: 'denied' };
  }
  await cancelStored();
  const id = await schedule(timeId);
  await setPref('reminderEnabled', '1');
  await setPref('reminderTime', timeId);
  await setPref('reminderNotificationId', id);
  return { ok: true };
}

export async function disableReminder() {
  await cancelStored();
  await setPref('reminderEnabled', '0');
  await setPref('reminderNotificationId', '');
}

// Run at startup: if the reminder is on, make sure permission is still granted and the schedule still exists.
export async function syncReminder() {
  const { enabled, time } = await getReminderState();
  if (!enabled) return;
  if (!(await hasPermission())) {
    await disableReminder();
    return;
  }
  const storedId = await getPref('reminderNotificationId', '');
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (!storedId || !scheduled.some((n) => n.identifier === storedId)) {
    const id = await schedule(time);
    await setPref('reminderNotificationId', id);
  }
}
