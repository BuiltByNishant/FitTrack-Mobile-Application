import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../../theme';
import { Button, Card, SectionTitle, confirmAction, reportError } from '../../components/ui';
import { deleteCustomWorkout, duplicateCustomWorkout, getCustomWorkout } from '../../repo/customWorkouts';
import { summarizePlan } from '../../services/routineService';
import { beginWorkout, useFocusLoad } from '../../utils/helpers';

// Saved workout details: the plan, with Start, Edit, Duplicate and Delete.
export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const workoutId = Number(id);
  const [workout, setWorkout] = useState(null);

  const load = useCallback(async () => {
    const w = await getCustomWorkout(workoutId);
    if (!w) {
      if (router.canGoBack()) router.back();
      return;
    }
    setWorkout(w);
  }, [workoutId]);
  useFocusLoad(load);

  async function handleDuplicate() {
    try {
      await duplicateCustomWorkout(workoutId);
      router.back(); // the copy appears in the My workouts list
    } catch (e) {
      reportError(e);
    }
  }

  function handleDelete() {
    confirmAction({
      title: 'Delete this workout?',
      message: `"${workout.name}" will be deleted. Workouts you already did with it stay in History unchanged.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteCustomWorkout(workoutId);
          router.back();
        } catch (e) {
          reportError(e);
        }
      },
    });
  }

  if (!workout) return <View style={styles.screen} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {workout.name}
      </Text>
      <Text style={styles.sub}>{summarizePlan(workout.items)}</Text>

      <Button title="Start workout" icon="play" onPress={() => beginWorkout({ customId: workoutId })} />

      <SectionTitle>Plan</SectionTitle>
      {workout.items.map((item, index) => (
        <Card key={item.exerciseId} style={styles.itemCard}>
          <View style={styles.order}>
            <Text style={styles.orderText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.muscleGroup} · {item.equipment}
            </Text>
          </View>
          <Text style={styles.target} accessibilityLabel={`${item.targetSets} sets of ${item.targetReps} reps`}>
            {item.targetSets} × {item.targetReps}
          </Text>
        </Card>
      ))}

      <View style={styles.actions}>
        <Button title="Edit" icon="create-outline" variant="secondary" compact onPress={() => router.push({ pathname: '/builder', params: { id: String(workoutId) } })} style={styles.action} />
        <Button title="Duplicate" icon="copy-outline" variant="secondary" compact onPress={handleDuplicate} style={styles.action} />
      </View>
      <Button title="Delete workout" icon="trash-outline" variant="danger" onPress={handleDelete} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  sub: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  order: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  orderText: { fontWeight: '800', color: colors.primaryDark },
  itemName: { fontSize: 16, fontWeight: '800', color: colors.text },
  itemMeta: { fontSize: 13, color: colors.muted },
  target: { fontSize: 18, fontWeight: '900', color: colors.primary, marginLeft: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.lg },
  action: { flex: 1, marginRight: spacing.sm },
});
