import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Button, Card, EmptyState, SectionTitle, StatTile } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext';
import { getActiveSession, listCompletedSessions, listCompletedWeightedSets } from '../../repo/sessions';
import { bestCompletedSet, countSessionsThisWeek } from '../../services/workoutService';
import { useFocusLoad } from '../../utils/helpers';
import { formatDate, formatDuration, formatTime } from '../../utils/dates';
import { formatWeight } from '../../utils/units';

export default function HomeScreen() {
  const { weightUnit } = useSettings();
  const [active, setActive] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [best, setBest] = useState(null);

  const load = useCallback(async () => {
    const [a, s, sets] = await Promise.all([getActiveSession(), listCompletedSessions(), listCompletedWeightedSets()]);
    setActive(a);
    setSessions(s);
    setBest(bestCompletedSet(sets));
  }, []);
  useFocusLoad(load);

  const weekCount = countSessionsThisWeek(sessions);
  const recent = sessions.slice(0, 3);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sub}>Plan it. Log it. See your progress.</Text>

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
        <StatTile label="This week" value={String(weekCount)} hint={weekCount === 1 ? 'completed workout' : 'completed workouts'} />
        <View style={{ width: spacing.md }} />
        <StatTile
          label="Best set"
          value={best ? `${formatWeight(best.weightKg, weightUnit)} × ${best.reps}` : '—'}
          hint={best ? best.name : 'Complete a weighted set to see it'}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button title="Start a workout" icon="barbell" onPress={() => router.navigate('/workouts')} />
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
  sub: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  activeCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  activeTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginLeft: spacing.sm },
  activeMeta: { fontSize: 15, color: colors.text, marginTop: spacing.xs },
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
