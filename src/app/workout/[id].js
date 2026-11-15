import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { Button, Card, confirmAction, reportError } from '../../components/ui';
import SetRow from '../../components/SetRow';
import { useSettings } from '../../context/SettingsContext';
import { deleteSession, finishSession, getSessionDetail, setSetCompleted, updateSetValues } from '../../repo/sessions';
import { checkCanFinish, computeSessionTotals } from '../../services/workoutService';
import { useFocusLoad } from '../../utils/helpers';
import { formatClock } from '../../utils/dates';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams();
  const sessionId = Number(id);
  const navigation = useNavigation();
  const { weightUnit } = useSettings();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [finishing, setFinishing] = useState(false);
  const invalidSets = useRef(new Set());

  const load = useCallback(async () => {
    const detail = await getSessionDetail(sessionId);
    if (!detail) {
      if (router.canGoBack()) router.back();
      return;
    }
    if (detail.endedAt) {
      router.replace(`/session/${sessionId}`);
      return;
    }
    setSession(detail);
  }, [sessionId]);
  useFocusLoad(load); // also refreshes after returning from the exercise picker

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (session?.title) navigation.setOptions({ title: session.title });
  }, [session?.title]);

  const onValidity = useCallback((setId, ok) => {
    if (ok) invalidSets.current.delete(setId);
    else invalidSets.current.add(setId);
  }, []);

  const handleSave = useCallback(async (setId, values) => {
    try {
      await updateSetValues(setId, values);
    } catch (e) {
      reportError(e);
    }
  }, []);

  const handleToggle = useCallback(
    async (setId, completed, values) => {
      try {
        if (values) await updateSetValues(setId, values);
        await setSetCompleted(setId, completed);
        await load();
      } catch (e) {
        reportError(e);
      }
    },
    [load]
  );

  async function handleFinish() {
    Keyboard.dismiss();
    if (invalidSets.current.size > 0) {
      Alert.alert('Fix invalid sets', 'Some sets have values that cannot be saved. Correct the highlighted fields, then finish again.');
      return;
    }
    setFinishing(true);
    try {
      const fresh = await getSessionDetail(sessionId);
      const problem = checkCanFinish(fresh);
      if (problem) {
        setFinishing(false);
        Alert.alert("Can't finish yet", problem);
        return;
      }
      await finishSession(sessionId);
      router.replace({ pathname: `/session/${sessionId}`, params: { saved: '1' } });
    } catch (e) {
      setFinishing(false);
      reportError(e);
    }
  }

  function handleDiscard() {
    confirmAction({
      title: 'Discard this workout?',
      message: 'Everything you logged in this workout will be deleted.',
      confirmText: 'Discard',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteSession(sessionId);
          if (router.canGoBack()) router.back();
          else router.replace('/');
        } catch (e) {
          reportError(e);
        }
      },
    });
  }

  if (!session) return <View style={styles.screen} />;

  const totals = computeSessionTotals(session);
  const elapsed = now - new Date(session.startedAt).getTime();

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View accessible accessibilityLabel={`Elapsed time ${formatClock(elapsed)}. ${totals.completedSets} of ${totals.totalSets} sets done.`}>
          <Text style={styles.timer}>{formatClock(elapsed)}</Text>
          <Text style={styles.topMeta}>
            {totals.completedSets}/{totals.totalSets} sets done
          </Text>
        </View>
        <Button title="Finish" icon="checkmark-circle" compact onPress={handleFinish} loading={finishing} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl * 2 }]}
      >
        {session.exercises.map((ex) => (
          <Card key={ex.exerciseId}>
            <Text style={styles.exName}>{ex.name}</Text>
            <Text style={styles.exGroup}>
              {ex.muscleGroup} · {ex.equipment}
              {ex.isBodyweight ? ' · weight = extra weight (0 if none)' : ''}
            </Text>
            <View style={styles.colHeader}>
              <View style={{ width: 38 }} />
              <Text style={styles.colText}>Weight ({weightUnit})</Text>
              <View style={{ width: 28 }} />
              <Text style={styles.colText}>Reps</Text>
              <View style={{ width: 86 }} />
            </View>
            {ex.sets.map((s) => (
              <SetRow key={s.id} set={s} unit={weightUnit} onSave={handleSave} onToggle={handleToggle} onValidity={onValidity} />
            ))}
          </Card>
        ))}

        <Button
          title="Add exercise"
          icon="add-circle-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/picker', params: { sessionId: String(sessionId) } })}
        />
        <Button title="Discard workout" icon="trash-outline" variant="danger" onPress={handleDiscard} style={{ marginTop: spacing.sm }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timer: { fontSize: 28, fontWeight: '900', color: colors.primary, fontVariant: ['tabular-nums'] },
  topMeta: { fontSize: 13, color: colors.muted },
  content: { padding: spacing.lg },
  exName: { fontSize: 18, fontWeight: '800', color: colors.text },
  exGroup: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  colHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  colText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: colors.muted },
});
