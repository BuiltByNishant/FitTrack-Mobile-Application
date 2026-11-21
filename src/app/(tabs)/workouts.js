import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { Button, Card, SectionTitle } from '../../components/ui';
import { TEMPLATES, SETS_PER_EXERCISE } from '../../data/templates';
import { listCustomWorkouts } from '../../repo/customWorkouts';
import { beginWorkout, useFocusLoad } from '../../utils/helpers';

export default function WorkoutsScreen() {
  const [mine, setMine] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setMine(await listCustomWorkouts());
    setLoaded(true);
  }, []);
  useFocusLoad(load);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>My workouts</SectionTitle>
      <Button title="Create workout" icon="add-circle" onPress={() => router.push('/builder')} />

      {loaded && mine.length === 0 ? (
        <Text style={styles.empty}>
          You have no saved workouts yet. Build your own routine once, then start it any time.
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        {mine.map((w) => (
          <Card key={w.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${w.name}, ${w.exerciseCount} exercises, ${w.setCount} sets. Open details`}
              onPress={() => router.push(`/routine/${w.id}`)}
              style={styles.cardTop}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{w.name}</Text>
                <Text style={styles.desc}>
                  {w.exerciseCount} exercise{w.exerciseCount === 1 ? '' : 's'} · {w.setCount} set{w.setCount === 1 ? '' : 's'}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {w.exerciseNames.join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
            <View style={styles.actions}>
              <Button title="Start" icon="play" compact onPress={() => beginWorkout({ customId: w.id })} style={styles.action} />
              <Button title="Details" variant="secondary" compact onPress={() => router.push(`/routine/${w.id}`)} style={styles.action} />
            </View>
          </Card>
        ))}
      </View>

      <SectionTitle>Built-in workouts</SectionTitle>
      <Text style={styles.intro}>
        Ready-made workouts. Each exercise starts with {SETS_PER_EXERCISE} sets, and you can add more exercises while you train.
      </Text>
      {TEMPLATES.map((t) => (
        <Card key={t.id}>
          <Text style={styles.name} accessibilityRole="header">
            {t.name}
          </Text>
          <Text style={styles.desc}>{t.description}</Text>
          {t.exercises.map((e) => (
            <Text key={e.name} style={styles.exercise}>
              • {e.name} — {SETS_PER_EXERCISE} × {e.reps}
            </Text>
          ))}
          <Button title={`Start ${t.name}`} icon="play" onPress={() => beginWorkout({ template: t })} style={{ marginTop: spacing.md }} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  empty: { fontSize: 14, color: colors.muted, marginTop: spacing.md },
  intro: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.muted, marginBottom: 2 },
  preview: { fontSize: 13, color: colors.muted },
  exercise: { fontSize: 15, color: colors.text, marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: spacing.sm },
  action: { flex: 1, marginRight: spacing.sm },
});
