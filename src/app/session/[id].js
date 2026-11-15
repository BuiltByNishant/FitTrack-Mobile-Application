import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Button, SectionTitle, StatTile } from '../../components/ui';
import SessionExerciseList from '../../components/SessionExerciseList';
import { useSettings } from '../../context/SettingsContext';
import { getSessionDetail } from '../../repo/sessions';
import { computeSessionTotals } from '../../services/workoutService';
import { useFocusLoad } from '../../utils/helpers';
import { formatDate, formatDuration, formatTime } from '../../utils/dates';
import { formatWeight } from '../../utils/units';

export default function SessionDetailScreen() {
  const { id, saved } = useLocalSearchParams();
  const sessionId = Number(id);
  const { weightUnit } = useSettings();
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    const d = await getSessionDetail(sessionId);
    if (!d) {
      if (router.canGoBack()) router.back();
      return;
    }
    if (!d.endedAt) {
      router.replace(`/workout/${sessionId}`);
      return;
    }
    setDetail(d);
  }, [sessionId]);
  useFocusLoad(load);

  if (!detail) return <View style={styles.screen} />;
  const totals = computeSessionTotals(detail);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {saved ? (
        <View style={styles.banner} accessible accessibilityLiveRegion="polite" accessibilityLabel="Workout saved">
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={styles.bannerText}>Workout saved to History</Text>
        </View>
      ) : null}

      <Text style={styles.title}>{detail.title}</Text>
      <Text style={styles.sub}>
        {formatDate(detail.startedAt)} · {formatTime(detail.startedAt)} – {formatTime(detail.endedAt)}
      </Text>

      <View style={styles.row}>
        <StatTile label="Duration" value={formatDuration(totals.durationMs)} />
        <View style={{ width: spacing.md }} />
        <StatTile label="Sets done" value={`${totals.completedSets}/${totals.totalSets}`} hint={`${totals.exerciseCount} exercises`} />
      </View>
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <StatTile label="Volume" value={formatWeight(totals.volumeKg, weightUnit)} hint="Simple logging metric (weight × reps of done sets)" />
      </View>

      <SectionTitle>Exercises</SectionTitle>
      <SessionExerciseList exercises={detail.exercises} unit={weightUnit} />

      {saved ? (
        <Button title="Open History" icon="time-outline" onPress={() => router.navigate('/history')} style={{ marginTop: spacing.sm }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { marginLeft: spacing.sm, fontSize: 16, fontWeight: '800', color: colors.success },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  sub: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg },
  row: { flexDirection: 'row' },
});
