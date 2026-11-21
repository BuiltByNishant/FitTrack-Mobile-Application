import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Button, Card, EmptyState, ProgressBar, SectionTitle, StatTile } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext';
import { getProfile } from '../../repo/profile';
import { getActiveSession, listCompletedSessions, listCompletedWeightedSets } from '../../repo/sessions';
import { listWeightEntries } from '../../repo/weight';
import { getReminderState, timeLabel } from '../../notifications/reminder';
import { bestCompletedSet, countSessionsThisWeek } from '../../services/workoutService';
import { currentWeight, goalProgress, greeting, weeklyGoalProgress } from '../../services/progressService';
import { useFocusLoad } from '../../utils/helpers';
import { formatDate, formatDuration, formatTime } from '../../utils/dates';
import { formatNumber, formatWeight, kgToDisplay } from '../../utils/units';

export default function HomeScreen() {
  const { weightUnit } = useSettings();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const [profile, entries, active, sessions, sets, reminder] = await Promise.all([
      getProfile(),
      listWeightEntries(),
      getActiveSession(),
      listCompletedSessions(),
      listCompletedWeightedSets(),
      getReminderState(),
    ]);
    setData({ profile, entries, active, sessions, best: bestCompletedSet(sets), reminder });
  }, []);
  useFocusLoad(load);

  if (!data) return <View style={styles.screen} />;

  const { profile, entries, active, sessions, best, reminder } = data;
  const latest = currentWeight(entries);
  const first = entries.length ? entries[entries.length - 1] : null;
  const goal = goalProgress({ startKg: first?.weightKg ?? null, currentKg: latest?.weightKg ?? null, targetKg: profile.targetWeightKg });
  const weekCount = countSessionsThisWeek(sessions);
  const weekly = weeklyGoalProgress(weekCount, profile.weeklyGoal);
  const recent = sessions.slice(0, 3);
  const isNewUser = !profile.displayName && profile.heightCm == null && entries.length === 0;
  const round1 = (kg) => formatNumber(Math.round(kgToDisplay(kg, weightUnit) * 10) / 10);

  let goalValue = '—';
  let goalHint = 'Set a target in My Profile';
  if (goal) {
    goalValue = goal.reached ? 'Reached' : `${round1(goal.remainingKg)} ${weightUnit}`;
    goalHint = goal.reached ? `Target ${formatWeight(profile.targetWeightKg, weightUnit)}` : `to ${goal.direction === 'down' ? 'lose' : 'gain'} · target ${formatWeight(profile.targetWeightKg, weightUnit)}`;
  } else if (profile.targetWeightKg != null) {
    goalHint = 'Add a weight check-in to see progress';
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.greetRow}>
        <Text style={styles.greet} accessibilityRole="header">
          {greeting(new Date(), profile.displayName)}
        </Text>
        <Button title="Profile" icon="person-circle-outline" variant="ghost" compact onPress={() => router.push('/profile')} />
      </View>

      {isNewUser ? (
        <Card style={styles.setupCard}>
          <Text style={styles.setupTitle}>Make FitTrack yours</Text>
          <Text style={styles.setupText}>Add your name, height and weight to follow your progress. Everything stays on this phone and is optional.</Text>
          <Button title="Set up my profile" icon="person-outline" onPress={() => router.push('/profile')} style={{ marginTop: spacing.md }} />
        </Card>
      ) : null}

      {active ? (
        <Card style={styles.activeCard}>
          <View style={styles.row}>
            <Ionicons name="timer-outline" size={22} color={colors.primaryDark} />
            <Text style={styles.activeTitle}>Workout in progress</Text>
          </View>
          <Text style={styles.activeMeta}>
            {active.title} · started {formatTime(active.startedAt)}
          </Text>
          <Button title="Resume workout" icon="play" onPress={() => router.push(`/workout/${active.id}`)} style={{ marginTop: spacing.md }} />
        </Card>
      ) : null}

      <View style={styles.row}>
        <StatTile
          label="Current weight"
          value={latest ? formatWeight(latest.weightKg, weightUnit) : '—'}
          hint={latest ? `Measured ${formatDate(latest.measuredAt)}` : 'Add a check-in in Weight'}
        />
        <View style={{ width: spacing.md }} />
        <StatTile label="Goal progress" value={goalValue} hint={goalHint} />
      </View>

      {goal ? (
        <Card style={{ marginTop: spacing.md }}>
          <ProgressBar fraction={goal.fraction} label={goal.reached ? 'Goal reached' : `${Math.round(goal.fraction * 100)}% of the way to your target`} />
        </Card>
      ) : null}

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardTitle}>Workouts this week</Text>
        <Text style={styles.bigLine}>
          {weekly.count} of {weekly.goal}
        </Text>
        <ProgressBar fraction={weekly.fraction} label={weekly.met ? 'Weekly goal met' : `${weekly.goal - weekly.count} more to reach your weekly goal`} />
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={reminder.enabled ? `Daily reminder is on at ${timeLabel(reminder.time)}. Open settings` : 'Daily reminder is off. Open settings'}
        onPress={() => router.navigate('/settings')}
        style={styles.reminderRow}
      >
        <Ionicons name={reminder.enabled ? 'notifications' : 'notifications-off-outline'} size={22} color={colors.primaryDark} />
        <Text style={styles.reminderText}>{reminder.enabled ? `Daily reminder on · ${timeLabel(reminder.time)}` : 'Daily reminder off'}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <View style={{ marginTop: spacing.md }}>
        <Button title="Start workout" icon="barbell" onPress={() => router.navigate('/workouts')} />
      </View>

      <View style={[styles.row, { marginTop: spacing.md }]}>
        <StatTile
          label="Best set"
          value={best ? `${formatWeight(best.weightKg, weightUnit)} × ${best.reps}` : '—'}
          hint={best ? best.name : 'Complete a weighted set to see it'}
        />
      </View>

      <SectionTitle>Recent sessions</SectionTitle>
      {recent.length === 0 ? (
        <Card>
          <EmptyState icon="barbell-outline" title="No workouts yet" message="Finish a workout and it will show up here." />
        </Card>
      ) : (
        recent.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`${s.title}, ${formatDate(s.startedAt)}, ${s.completedSetCount} sets done`}
            onPress={() => router.push(`/session/${s.id}`)}
            style={styles.recentRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.recentName}>{s.title}</Text>
              <Text style={styles.recentMeta}>
                {formatDate(s.startedAt)} · {s.completedSetCount} sets done · {formatDuration(new Date(s.endedAt) - new Date(s.startedAt))}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  greet: { flex: 1, fontSize: 24, fontWeight: '900', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  setupCard: { borderColor: colors.primary },
  setupTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  setupText: { fontSize: 14, color: colors.muted, marginTop: 4 },
  activeCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  activeTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginLeft: spacing.sm },
  activeMeta: { fontSize: 15, color: colors.text, marginTop: spacing.xs },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.muted },
  bigLine: { fontSize: 26, fontWeight: '900', color: colors.primary, marginVertical: spacing.xs },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  reminderText: { flex: 1, marginLeft: spacing.sm, fontSize: 15, fontWeight: '700', color: colors.text },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentName: { fontSize: 16, fontWeight: '800', color: colors.text },
  recentMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
