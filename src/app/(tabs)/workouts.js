import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../../theme';
import { Button, Card } from '../../components/ui';
import { TEMPLATES, SETS_PER_EXERCISE } from '../../data/templates';
import { beginWorkout } from '../../utils/helpers';

export default function WorkoutsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Pick a ready-made workout. Each exercise starts with {SETS_PER_EXERCISE} sets, and you can add more exercises while you train.
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
          <Button
            title={`Start ${t.name}`}
            icon="play"
            onPress={() => beginWorkout(t)}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  intro: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  exercise: { fontSize: 15, color: colors.text, marginTop: 2 },
});
