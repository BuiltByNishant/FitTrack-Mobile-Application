import React, { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius, spacing } from '../../theme';
import { Button, Card, Chip, SectionTitle, confirmAction, reportError } from '../../components/ui';
import Segment from '../../components/Segment';
import { useSettings } from '../../context/SettingsContext';
import { deleteAllHistory, getDataCounts, resetAllData } from '../../repo/data';
import { clearProfile, getProfile, setWeeklyGoal } from '../../repo/profile';
import { clearWeightEntries } from '../../repo/weight';
import { loadDemoData } from '../../repo/demo';
import { setPref } from '../../repo/preferences';
import { REMINDER_TIMES, disableReminder, enableReminder, getReminderState, timeLabel } from '../../notifications/reminder';
import { useFocusLoad } from '../../utils/helpers';

export default function SettingsScreen() {
  const { weightUnit, heightUnit, setWeightUnit, setHeightUnit } = useSettings();
  const [weeklyGoal, setGoal] = useState(3);
  const [reminder, setReminder] = useState({ enabled: false, time: '18:00' });
  const [reminderMessage, setReminderMessage] = useState(null); // { text, denied }
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ sessions: 0, customExercises: 0, weightEntries: 0, customWorkouts: 0 });
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setReminder(await getReminderState());
    setCounts(await getDataCounts());
    setGoal((await getProfile()).weeklyGoal);
  }, []);
  useFocusLoad(load);

  async function applyReminder(timeId) {
    setBusy(true);
    try {
      const result = await enableReminder(timeId);
      if (result.ok) {
        setReminder({ enabled: true, time: timeId });
        setReminderMessage({ text: `Reminder on. FitTrack will remind you every day at ${timeLabel(timeId)}.`, denied: false });
      } else {
        setReminder({ enabled: false, time: timeId });
        setReminderMessage({
          text: 'Reminder is off. Android notification permission is needed to schedule it. You can allow notifications in Android Settings.',
          denied: true,
        });
      }
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(on) {
    if (on) {
      await applyReminder(reminder.time);
      return;
    }
    setBusy(true);
    try {
      await disableReminder();
      setReminder((r) => ({ ...r, enabled: false }));
      setReminderMessage({ text: 'Reminder turned off.', denied: false });
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handlePickTime(timeId) {
    if (reminder.enabled) {
      await applyReminder(timeId); // replaces the existing schedule
    } else {
      try {
        await setPref('reminderTime', timeId);
        setReminder((r) => ({ ...r, time: timeId }));
      } catch (e) {
        reportError(e);
      }
    }
  }

  async function changeGoal(next) {
    if (next < 1 || next > 7) return;
    setGoal(next);
    try {
      await setWeeklyGoal(next);
    } catch (e) {
      reportError(e);
    }
  }

  async function perform(fn, done) {
    try {
      await fn();
      setMessage(done);
      await load();
    } catch (e) {
      reportError(e);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>Units</SectionTitle>
      <Text style={styles.help}>Weight and height are saved in kg and cm. Units only change how values are shown, so switching never changes your saved data.</Text>
      <Segment
        label="Weight unit"
        options={[
          { id: 'kg', label: 'Kilograms (kg)' },
          { id: 'lb', label: 'Pounds (lb)' },
        ]}
        value={weightUnit}
        onChange={setWeightUnit}
      />
      <Segment
        label="Height unit"
        options={[
          { id: 'cm', label: 'Centimetres' },
          { id: 'ftin', label: 'Feet and inches' },
        ]}
        value={heightUnit}
        onChange={setHeightUnit}
      />

      <SectionTitle>Weekly workout target</SectionTitle>
      <Card>
        <View style={styles.switchRow}>
          <Button title="−" accessibilityLabel="Fewer workouts per week" variant="secondary" compact disabled={weeklyGoal <= 1} onPress={() => changeGoal(weeklyGoal - 1)} style={styles.stepBtn} />
          <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${weeklyGoal} workouts per week`}>
            <Text style={styles.goalNumber}>{weeklyGoal}</Text>
            <Text style={styles.help}>workouts per week</Text>
          </View>
          <Button title="+" accessibilityLabel="More workouts per week" variant="secondary" compact disabled={weeklyGoal >= 7} onPress={() => changeGoal(weeklyGoal + 1)} style={styles.stepBtn} />
        </View>
      </Card>

      <SectionTitle>Daily reminder</SectionTitle>
      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.switchTitle}>Remind me to work out</Text>
            <Text style={styles.help}>
              {reminder.enabled ? `On · every day at ${timeLabel(reminder.time)}` : 'Off · Android will ask for notification permission when you turn this on.'}
            </Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={handleToggle}
            disabled={busy}
            trackColor={{ true: colors.primary, false: '#9CA3AF' }}
            accessibilityLabel="Daily reminder"
          />
        </View>
        <Text style={styles.label}>Reminder time</Text>
        <View style={styles.chips}>
          {REMINDER_TIMES.map((t) => (
            <Chip key={t.id} label={t.label} selected={reminder.time === t.id} onPress={() => handlePickTime(t.id)} />
          ))}
        </View>
        {reminderMessage ? (
          <View style={styles.msg} accessibilityLiveRegion="polite">
            <Ionicons name={reminderMessage.denied ? 'alert-circle' : 'information-circle'} size={20} color={colors.primaryDark} />
            <Text style={styles.msgText}>{reminderMessage.text}</Text>
          </View>
        ) : null}
        {reminderMessage?.denied ? (
          <Button title="Open Android settings" icon="settings-outline" variant="secondary" compact onPress={() => Linking.openSettings()} style={{ marginTop: spacing.sm }} />
        ) : null}
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card>
        <Text style={styles.switchTitle}>
          {counts.sessions} saved workout{counts.sessions === 1 ? '' : 's'} · {counts.customWorkouts} custom workout{counts.customWorkouts === 1 ? '' : 's'} · {counts.weightEntries} weight check-in
          {counts.weightEntries === 1 ? '' : 's'} · {counts.customExercises} custom exercise{counts.customExercises === 1 ? '' : 's'}
        </Text>
        <Text style={styles.help}>Everything is stored on this phone only. No account or internet connection is needed.</Text>
      </Card>
      <Button
        title="Load demo data"
        icon="flask-outline"
        variant="secondary"
        onPress={() =>
          confirmAction({
            title: 'Load demo data?',
            message: 'Adds about four weeks of example workouts and weight check-ins, a sample "Push Day" custom workout, and fills a blank profile with an example name, height and target. Your existing data is kept.',
            confirmText: 'Load demo data',
            onConfirm: () => perform(loadDemoData, 'Demo data added. Check Home, Weight and History.'),
          })
        }
      />
      <Button
        title="Clear my profile"
        icon="person-remove-outline"
        variant="danger"
        style={{ marginTop: spacing.sm }}
        onPress={() =>
          confirmAction({
            title: 'Clear your profile?',
            message: 'Removes your name, height, target weight and weekly goal. Weight check-ins, workouts and unit choices are kept.',
            confirmText: 'Clear profile',
            destructive: true,
            onConfirm: () => perform(clearProfile, 'Profile cleared.'),
          })
        }
      />
      <Button
        title="Clear weight history"
        icon="scale-outline"
        variant="danger"
        style={{ marginTop: spacing.sm }}
        onPress={() =>
          confirmAction({
            title: 'Clear weight history?',
            message: 'Deletes every weight check-in. This cannot be undone.',
            confirmText: 'Clear history',
            destructive: true,
            onConfirm: () => perform(clearWeightEntries, 'Weight history cleared.'),
          })
        }
      />
      <Button
        title="Delete all workout history"
        icon="trash-outline"
        variant="danger"
        style={{ marginTop: spacing.sm }}
        onPress={() =>
          confirmAction({
            title: 'Delete all workout history?',
            message: 'Every saved workout will be removed. This cannot be undone.',
            confirmText: 'Delete history',
            destructive: true,
            onConfirm: () => perform(deleteAllHistory, 'Workout history deleted.'),
          })
        }
      />
      <Button
        title="Erase all my data"
        icon="warning-outline"
        variant="danger"
        style={{ marginTop: spacing.sm }}
        onPress={() =>
          confirmAction({
            title: 'Erase all your data?',
            message: 'Deletes your profile, weight check-ins, workouts, saved custom workouts and custom exercises. Unit and reminder settings are kept. This cannot be undone.',
            confirmText: 'Erase everything',
            destructive: true,
            onConfirm: () =>
              perform(async () => {
                await resetAllData();
                await clearWeightEntries();
                await clearProfile();
              }, 'All your data was erased.'),
          })
        }
      />
      {message ? (
        <View style={[styles.msg, { marginTop: spacing.lg }]} accessibilityLiveRegion="polite">
          <Ionicons name="information-circle" size={20} color={colors.primaryDark} />
          <Text style={styles.msgText}>{message}</Text>
        </View>
      ) : null}
      <Text style={styles.footer}>FitTrack 1.2.0 · Project 356</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  help: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  segment: { flexDirection: 'row' },
  segBtn: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  segBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: 15, fontWeight: '800', color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, minHeight: MIN_TOUCH },
  stepBtn: { width: 64 },
  goalNumber: { fontSize: 32, fontWeight: '900', color: colors.primary },
  switchTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  msg: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  msgText: { marginLeft: spacing.sm, color: colors.primaryDark, fontWeight: '700', flexShrink: 1 },
  footer: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, fontSize: 12 },
});
