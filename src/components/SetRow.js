import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';
import { FieldError } from './ui';
import { displayToKg, weightInputText } from '../utils/units';
import { validateReps, validateWeight } from '../utils/validation';

// One set. Valid edits are saved straight away, so nothing is lost if the person leaves the screen.
// A set can only be marked done when its values are valid. Done is shown with an icon AND text, not color alone.
export default function SetRow({ set, unit, onSave, onToggle, onValidity }) {
  const [weightText, setWeightText] = useState(weightInputText(set.weightKg, unit));
  const [repsText, setRepsText] = useState(String(set.reps));
  const [weightError, setWeightError] = useState(null);
  const [repsError, setRepsError] = useState(null);

  useEffect(() => {
    setWeightText(weightInputText(set.weightKg, unit));
    setWeightError(null);
  }, [set.weightKg, unit]);

  useEffect(() => {
    setRepsText(String(set.reps));
    setRepsError(null);
  }, [set.reps]);

  useEffect(() => {
    onValidity(set.id, !weightError && !repsError);
  }, [weightError, repsError]);

  useEffect(() => () => onValidity(set.id, true), []);

  function check(w, r) {
    const wr = validateWeight(w);
    const rr = validateReps(r);
    setWeightError(wr.ok ? null : wr.error);
    setRepsError(rr.ok ? null : rr.error);
    return { wr, rr };
  }

  function commit(w, r) {
    const { wr, rr } = check(w, r);
    if (wr.ok && rr.ok) onSave(set.id, { weightKg: displayToKg(wr.value, unit), reps: rr.value });
  }

  function handleToggle() {
    if (set.completed) {
      onToggle(set.id, false);
      return;
    }
    const { wr, rr } = check(weightText, repsText);
    if (!wr.ok || !rr.ok) return; // errors are now visible on the row
    onToggle(set.id, true, { weightKg: displayToKg(wr.value, unit), reps: rr.value });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.numBadge} accessible accessibilityLabel={`Set ${set.setNumber}`}>
          <Text style={styles.numText}>{set.setNumber}</Text>
        </View>
        <TextInput
          style={[styles.input, weightError && styles.inputError, set.completed && styles.inputDone]}
          value={weightText}
          onChangeText={(t) => {
            setWeightText(t);
            commit(t, repsText);
          }}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel={`Set ${set.setNumber} weight in ${unit}`}
        />
        <Text style={styles.times}>×</Text>
        <TextInput
          style={[styles.input, repsError && styles.inputError, set.completed && styles.inputDone]}
          value={repsText}
          onChangeText={(t) => {
            setRepsText(t);
            commit(weightText, t);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
          accessibilityLabel={`Set ${set.setNumber} repetitions`}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.completed }}
          accessibilityLabel={set.completed ? `Set ${set.setNumber} done. Tap to undo` : `Mark set ${set.setNumber} done`}
          onPress={handleToggle}
          style={[styles.doneBtn, set.completed && styles.doneBtnOn]}
        >
          <Ionicons
            name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={set.completed ? colors.white : colors.primary}
          />
          <Text style={[styles.doneText, set.completed && { color: colors.white }]}>{set.completed ? 'Done' : 'Mark'}</Text>
        </Pressable>
      </View>
      <FieldError message={weightError} />
      <FieldError message={repsError} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  numBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  numText: { color: colors.primaryDark, fontWeight: '800' },
  input: {
    flex: 1,
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
  inputDone: { backgroundColor: '#ECFDF5', borderColor: colors.success },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  times: { fontSize: 18, color: colors.muted, marginHorizontal: spacing.sm },
  doneBtn: {
    marginLeft: spacing.sm,
    minWidth: 78,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
  },
  doneBtnOn: { backgroundColor: colors.success, borderColor: colors.success },
  doneText: { marginLeft: 4, fontSize: 13, fontWeight: '800', color: colors.primary },
});
