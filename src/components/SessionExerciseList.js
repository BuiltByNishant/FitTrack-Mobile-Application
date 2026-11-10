import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { Card } from './ui';
import { formatWeight } from '../utils/units';

// Read-only view of a saved workout: each exercise with its sets, repetitions, weights and done state.
export default function SessionExerciseList({ exercises, unit }) {
  return (
    <>
      {exercises.map((ex) => (
        <Card key={ex.exerciseId}>
          <Text style={styles.name}>{ex.name}</Text>
          <Text style={styles.group}>
            {ex.muscleGroup} · {ex.equipment}
          </Text>
          {ex.sets.map((s) => {
            const w = s.weightKg === 0 && ex.isBodyweight ? 'Bodyweight' : formatWeight(s.weightKg, unit);
            return (
              <View
                key={s.id}
                style={styles.setRow}
                accessible
                accessibilityLabel={`Set ${s.setNumber}: ${w} for ${s.reps} repetitions, ${s.completed ? 'done' : 'not done'}`}
              >
                <Text style={styles.setNum}>Set {s.setNumber}</Text>
                <Text style={styles.setValue}>
                  {w} × {s.reps}
                </Text>
                <View style={styles.status}>
                  <Ionicons
                    name={s.completed ? 'checkmark-circle' : 'close-circle-outline'}
                    size={18}
                    color={s.completed ? colors.success : colors.muted}
                  />
                  <Text style={[styles.statusText, { color: s.completed ? colors.success : colors.muted }]}>
                    {s.completed ? 'Done' : 'Not done'}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  group: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  setNum: { width: 56, fontSize: 14, color: colors.muted, fontWeight: '700' },
  setValue: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '700' },
  status: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 4, fontSize: 13, fontWeight: '700' },
});
