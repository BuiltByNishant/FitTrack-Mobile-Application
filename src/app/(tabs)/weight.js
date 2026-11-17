import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { Button, Card, EmptyState, ProgressBar, SectionTitle } from '../../components/ui';
import WeightTrend from '../../components/WeightTrend';
import { useSettings } from '../../context/SettingsContext';
import { getProfile } from '../../repo/profile';
import { listWeightEntries } from '../../repo/weight';
import { currentWeight, goalProgress, trendPoints, weightChangeKg } from '../../services/progressService';
import { useFocusLoad } from '../../utils/helpers';
import { formatDate } from '../../utils/dates';
import { formatNumber, formatWeight, kgToDisplay } from '../../utils/units';

export default function WeightLogScreen() {
  const { weightUnit } = useSettings();
  const [entries, setEntries] = useState([]);
  const [targetKg, setTargetKg] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [list, profile] = await Promise.all([listWeightEntries(), getProfile()]);
    setEntries(list);
    setTargetKg(profile.targetWeightKg);
    setLoaded(true);
  }, []);
  useFocusLoad(load);

  if (!loaded) return <View style={styles.screen} />;

  if (entries.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="scale-outline"
          title="No weight check-ins yet"
          message="Add your weight to follow your trend and your progress toward a target."
          actionTitle="Add a check-in"
          onAction={() => router.push('/weight-entry')}
        />
      </View>
    );
  }

  const latest = currentWeight(entries);
  const first = entries[entries.length - 1];
  const progress = goalProgress({ startKg: first.weightKg, currentKg: latest.weightKg, targetKg });
  const change = weightChangeKg(entries);
  const changeShown = change == null ? null : Math.round(kgToDisplay(Math.abs(change), weightUnit) * 10) / 10;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.label}>Current weight</Text>
        <Text style={styles.big}>{formatWeight(latest.weightKg, weightUnit)}</Text>
        <Text style={styles.sub}>Measured {formatDate(latest.measuredAt)}</Text>
        {changeShown != null ? (
          <View style={styles.changeRow}>
            <Ionicons name={change < 0 ? 'trending-down' : change > 0 ? 'trending-up' : 'remove'} size={18} color={colors.muted} />
            <Text style={styles.changeText}>
              {changeShown === 0 ? 'No change' : `${change < 0 ? 'Down' : 'Up'} ${formatNumber(changeShown)} ${weightUnit}`} since your first entry
            </Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.label}>Goal</Text>
        {progress ? (
          <>
            <Text style={styles.goalLine}>
              Target {formatWeight(targetKg, weightUnit)} ·{' '}
              {progress.reached
                ? 'Goal reached'
                : `${formatNumber(Math.round(kgToDisplay(progress.remainingKg, weightUnit) * 10) / 10)} ${weightUnit} to ${progress.direction === 'down' ? 'lose' : 'gain'}`}
            </Text>
            <ProgressBar
              fraction={progress.fraction}
              label={progress.reached ? 'Goal reached' : `${Math.round(progress.fraction * 100)}% of the way from your first entry`}
            />
          </>
        ) : (
          <>
            <Text style={styles.sub}>No target weight set. A target is optional.</Text>
            <Button title="Set a target in My Profile" variant="secondary" compact onPress={() => router.push('/profile')} style={{ marginTop: spacing.sm }} />
          </>
        )}
      </Card>

      {entries.length >= 2 ? (
        <>
          <SectionTitle>Trend</SectionTitle>
          <Card>
            <WeightTrend points={trendPoints(entries, 8)} unit={weightUnit} />
          </Card>
        </>
      ) : (
        <Text style={styles.sub}>Add one more check-in to see your trend.</Text>
      )}

      <Button title="Add a check-in" icon="add-circle" onPress={() => router.push('/weight-entry')} style={{ marginTop: spacing.sm }} />

      <SectionTitle>All check-ins ({entries.length})</SectionTitle>
      {entries.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`${formatDate(e.measuredAt)}, ${formatWeight(e.weightKg, weightUnit)}${e.note ? `, note: ${e.note}` : ''}. Edit or delete`}
          onPress={() => router.push({ pathname: '/weight-entry', params: { id: String(e.id) } })}
          style={styles.row}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowDate}>{formatDate(e.measuredAt)}</Text>
            {e.note ? <Text style={styles.rowNote}>{e.note}</Text> : null}
          </View>
          <Text style={styles.rowWeight}>{formatWeight(e.weightKg, weightUnit)}</Text>
          <Ionicons name="create-outline" size={20} color={colors.muted} style={{ marginLeft: spacing.sm }} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 13, fontWeight: '800', color: colors.muted },
  big: { fontSize: 34, fontWeight: '900', color: colors.primary, marginTop: 2 },
  sub: { fontSize: 14, color: colors.muted },
  goalLine: { fontSize: 16, fontWeight: '800', color: colors.text, marginVertical: spacing.sm },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  changeText: { marginLeft: 6, fontSize: 14, color: colors.text, fontWeight: '600' },
  row: {
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
  rowDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowNote: { fontSize: 13, color: colors.muted, marginTop: 2 },
  rowWeight: { fontSize: 17, fontWeight: '900', color: colors.primary },
});
