import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';
import { Button, Card, FieldError, IconButton, TextField, confirmAction, reportError } from '../components/ui';
import { listExercises } from '../repo/exercises';
import { getCustomWorkout, saveCustomWorkout } from '../repo/customWorkouts';
import { DEFAULT_REPS, DEFAULT_SETS, moveItem, validateRoutine } from '../services/routineService';
import { takePickerResult } from '../state/pickerResult';
import { useFocusLoad } from '../utils/helpers';

// Create or edit a saved workout: name, exercises (from the library), target sets and reps, order.
export default function BuilderScreen() {
  const { id } = useLocalSearchParams();
  const workoutId = id ? Number(id) : null;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [items, setItems] = useState([]); // { exerciseId, name, muscleGroup, equipment, setsText, repsText }
  const [errors, setErrors] = useState({ nameError: null, listError: null, itemErrors: {} });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: workoutId ? 'Edit workout' : 'New workout' });
    if (!workoutId) return;
    getCustomWorkout(workoutId)
      .then((w) => {
        if (!w) {
          router.back();
          return;
        }
        setName(w.name);
        setItems(
          w.items.map((i) => ({
            exerciseId: i.exerciseId,
            name: i.name,
            muscleGroup: i.muscleGroup,
            equipment: i.equipment,
            setsText: String(i.targetSets),
            repsText: String(i.targetReps),
          }))
        );
      })
      .catch(reportError);
  }, [workoutId]);

  // When the picker closes, add the exercises that were chosen there.
  const takePicked = useCallback(async () => {
    const ids = takePickerResult();
    if (!ids || ids.length === 0) return;
    const all = await listExercises();
    setItems((cur) => {
      const have = new Set(cur.map((i) => i.exerciseId));
      const added = ids
        .filter((x) => !have.has(x))
        .map((x) => all.find((e) => e.id === x))
        .filter(Boolean)
        .map((e) => ({
          exerciseId: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
          equipment: e.equipment,
          setsText: String(DEFAULT_SETS),
          repsText: String(DEFAULT_REPS),
        }));
      return [...cur, ...added];
    });
    setErrors((e) => ({ ...e, listError: null }));
    setDirty(true);
  }, []);
  useFocusLoad(takePicked);

  function touch() {
    setDirty(true);
  }

  function updateItem(exerciseId, field, text) {
    setItems((cur) => cur.map((i) => (i.exerciseId === exerciseId ? { ...i, [field]: text } : i)));
    setErrors((e) => {
      const itemErrors = { ...e.itemErrors };
      delete itemErrors[exerciseId];
      return { ...e, itemErrors };
    });
    touch();
  }

  function move(index, dir) {
    setItems((cur) => moveItem(cur, index, dir));
    touch();
  }

  function remove(exerciseId) {
    setItems((cur) => cur.filter((i) => i.exerciseId !== exerciseId));
    touch();
  }

  function openPicker() {
    router.push({ pathname: '/picker', params: { mode: 'routine', exclude: items.map((i) => i.exerciseId).join(',') } });
  }

  async function handleSave() {
    const result = validateRoutine({ name, items });
    setErrors({ nameError: result.nameError, listError: result.listError, itemErrors: result.itemErrors });
    if (!result.ok) return;
    setSaving(true);
    try {
      await saveCustomWorkout({ id: workoutId, name: result.value.name, items: result.value.items });
      router.back();
    } catch (e) {
      setSaving(false);
      reportError(e);
    }
  }

  function handleCancel() {
    if (!dirty) {
      router.back();
      return;
    }
    confirmAction({
      title: 'Discard changes?',
      message: 'Your unsaved changes to this workout will be lost.',
      confirmText: 'Discard',
      destructive: true,
      onConfirm: () => router.back(),
    });
  }

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl * 2 }]}
    >
      <TextField
        label="Workout name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, nameError: null }));
          touch();
        }}
        placeholder='e.g. "Push Day" or "Home Strength"'
        maxLength={60}
        error={errors.nameError}
      />

      <Text style={styles.heading} accessibilityRole="header">
        Exercises ({items.length})
      </Text>
      {items.length === 0 ? <Text style={styles.hint}>No exercises yet. Add some from the library, then set sets and reps for each.</Text> : null}

      {items.map((item, index) => {
        const err = errors.itemErrors[item.exerciseId] ?? {};
        return (
          <Card key={item.exerciseId} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.order}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.muscleGroup} · {item.equipment}
                </Text>
              </View>
            </View>

            <View style={styles.targets}>
              <View style={styles.targetBox}>
                <Text style={styles.targetLabel}>Sets</Text>
                <TextInput
                  style={[styles.targetInput, err.sets && styles.inputError]}
                  value={item.setsText}
                  onChangeText={(t) => updateItem(item.exerciseId, 'setsText', t)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  accessibilityLabel={`${item.name} planned sets`}
                />
              </View>
              <Text style={styles.times}>×</Text>
              <View style={styles.targetBox}>
                <Text style={styles.targetLabel}>Target reps</Text>
                <TextInput
                  style={[styles.targetInput, err.reps && styles.inputError]}
                  value={item.repsText}
                  onChangeText={(t) => updateItem(item.exerciseId, 'repsText', t)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  accessibilityLabel={`${item.name} target repetitions`}
                />
              </View>
            </View>
            <FieldError message={err.sets} />
            <FieldError message={err.reps} />
            <FieldError message={err.duplicate} />

            <View style={styles.itemActions}>
              <IconButton name="arrow-up" label={`Move ${item.name} up`} disabled={index === 0} onPress={() => move(index, -1)} />
              <IconButton
                name="arrow-down"
                label={`Move ${item.name} down`}
                disabled={index === items.length - 1}
                onPress={() => move(index, 1)}
              />
              <View style={{ flex: 1 }} />
              <IconButton name="trash-outline" label={`Remove ${item.name}`} color={colors.danger} onPress={() => remove(item.exerciseId)} />
            </View>
          </Card>
        );
      })}
      <FieldError message={errors.listError} />

      <Button title="Add exercises" icon="add-circle-outline" variant="secondary" onPress={openPicker} style={{ marginTop: spacing.sm }} />
      <Button title={workoutId ? 'Save changes' : 'Save workout'} icon="checkmark" onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
      <Button title="Cancel" variant="ghost" onPress={handleCancel} style={{ marginTop: spacing.xs }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  itemCard: { padding: spacing.md, marginBottom: spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
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
  targets: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  targetBox: { flex: 1 },
  targetLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, marginBottom: 4 },
  targetInput: {
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  times: { fontSize: 18, color: colors.muted, marginHorizontal: spacing.md, marginBottom: 12 },
  itemActions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
});
