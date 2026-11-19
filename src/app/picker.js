import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';
import { Button, Chip, FieldError, reportError } from '../components/ui';
import { createExercise, listExercises } from '../repo/exercises';
import { addExerciseToSession, getSessionDetail } from '../repo/sessions';
import { setPickerResult } from '../state/pickerResult';
import { EQUIPMENT, MUSCLE_GROUPS } from '../db/seed';
import { validateName } from '../utils/validation';

// Exercise picker: search the starter library (grouped by muscle group) or create a custom exercise.
// Session mode (default): choosing an exercise adds it to the active workout with three starter sets.
// Routine mode (mode=routine): choose several exercises and hand them back to the workout builder.
export default function PickerScreen() {
  const { sessionId, mode, exclude } = useLocalSearchParams();
  const routineMode = mode === 'routine';
  const [selected, setSelected] = useState([]);
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState([]);
  const [inSession, setInSession] = useState([]);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState(MUSCLE_GROUPS[0]);
  const [newEquipment, setNewEquipment] = useState(EQUIPMENT[0]);
  const [createError, setCreateError] = useState(null);

  const load = useCallback(async () => {
    const list = await listExercises();
    setExercises(list);
    if (routineMode) {
      setInSession(String(exclude ?? '').split(',').filter(Boolean).map(Number));
    } else {
      const detail = await getSessionDetail(Number(sessionId));
      setInSession(detail ? detail.exercises.map((e) => e.exerciseId) : []);
    }
  }, [sessionId, routineMode, exclude]);

  useEffect(() => {
    load().catch(reportError);
  }, [load]);

  async function addAndClose(exerciseId) {
    try {
      await addExerciseToSession(Number(sessionId), exerciseId);
      router.back();
    } catch (e) {
      reportError(e);
    }
  }

  function toggle(exerciseId) {
    setSelected((cur) => (cur.includes(exerciseId) ? cur.filter((x) => x !== exerciseId) : [...cur, exerciseId]));
  }

  function confirmSelection() {
    setPickerResult(selected);
    router.back();
  }

  async function handleCreate() {
    const check = validateName(newName, 'Exercise name');
    if (!check.ok) {
      setCreateError(check.error);
      return;
    }
    try {
      const id = await createExercise({ name: check.value, muscleGroup: newGroup, equipment: newEquipment });
      if (routineMode) {
        // saved to the library and ticked, so it can be added with the rest
        await load();
        setSelected((cur) => [...cur, id]);
        setNewName('');
        setCreating(false);
        return;
      }
      await addAndClose(id); // saved to the library AND added to this workout
    } catch (e) {
      setCreateError(e.message);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = exercises.filter((e) => !q || e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q));
  const sections = MUSCLE_GROUPS.map((g) => ({ title: g, data: filtered.filter((e) => e.muscleGroup === g) })).filter(
    (s) => s.data.length > 0
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises or muscle groups"
          placeholderTextColor="#6B7280"
          accessibilityLabel="Search exercises"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a custom exercise"
        onPress={() => setCreating((v) => !v)}
        style={styles.createToggle}
      >
        <Ionicons name={creating ? 'chevron-up' : 'add-circle-outline'} size={22} color={colors.primary} />
        <Text style={styles.createToggleText}>Create a custom exercise</Text>
      </Pressable>

      {creating ? (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            value={newName}
            onChangeText={(t) => {
              setNewName(t);
              setCreateError(null);
            }}
            placeholder="Exercise name"
            placeholderTextColor="#6B7280"
            maxLength={60}
            accessibilityLabel="Custom exercise name"
          />
          <FieldError message={createError} />
          <Text style={styles.chipLabel}>Muscle group</Text>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map((g) => (
              <Chip key={g} label={g} selected={newGroup === g} onPress={() => setNewGroup(g)} />
            ))}
          </View>
          <Text style={styles.chipLabel}>Equipment</Text>
          <View style={styles.chips}>
            {EQUIPMENT.map((g) => (
              <Chip key={g} label={g} selected={newEquipment === g} onPress={() => setNewEquipment(g)} />
            ))}
          </View>
          <Button title={routineMode ? 'Save exercise' : 'Save and add to workout'} icon="add" onPress={handleCreate} />
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}
        ListEmptyComponent={<Text style={styles.empty}>No exercises match. Try another search or create a custom exercise.</Text>}
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={styles.groupHeader}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const added = inSession.includes(item.id);
          const on = selected.includes(item.id);
          return (
            <Pressable
              accessibilityRole={routineMode ? 'checkbox' : 'button'}
              accessibilityState={routineMode ? { checked: on, disabled: added } : { disabled: added }}
              accessibilityLabel={`${item.name}, ${item.equipment}${added ? ', already in this workout' : routineMode ? '' : '. Add to workout'}`}
              disabled={added}
              onPress={() => (routineMode ? toggle(item.id) : addAndClose(item.id))}
              style={[styles.row, added && { opacity: 0.55 }, on && styles.rowOn]}
            >
              {routineMode && !added ? (
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={on ? colors.primary : colors.muted} style={{ marginRight: spacing.md }} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.equipment}
                  {item.isCustom ? ' · Custom' : ''}
                </Text>
              </View>
              {added ? <Text style={styles.addedText}>Added</Text> : routineMode ? null : <Ionicons name="add-circle" size={28} color={colors.primary} />}
            </Pressable>
          );
        }}
      />

      {routineMode ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            title={selected.length ? `Add ${selected.length} exercise${selected.length === 1 ? '' : 's'} to workout` : 'Select exercises to add'}
            disabled={selected.length === 0}
            onPress={confirmSelection}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  search: { flex: 1, fontSize: 16, color: colors.text, marginLeft: spacing.sm, minHeight: MIN_TOUCH },
  createToggle: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, paddingHorizontal: spacing.lg },
  createToggleText: { fontSize: 15, fontWeight: '700', color: colors.primary, marginLeft: spacing.sm },
  createBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createInput: {
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  chipLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  groupHeader: { fontSize: 14, fontWeight: '800', color: colors.muted, marginTop: spacing.md, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  addedText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, fontSize: 15 },
});
