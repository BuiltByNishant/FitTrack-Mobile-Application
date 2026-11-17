import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { Button, TextField, confirmAction, reportError } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { addWeightEntry, deleteWeightEntry, getWeightEntry, updateWeightEntry } from '../repo/weight';
import { noonOf } from '../services/progressService';
import { formatDate } from '../utils/dates';
import { displayToKg, formatNumber, kgToDisplay } from '../utils/units';
import { validateBodyWeight } from '../utils/validation';

// Add, correct or remove one dated weight check-in.
export default function WeightEntryScreen() {
  const { id } = useLocalSearchParams();
  const entryId = id ? Number(id) : null;
  const navigation = useNavigation();
  const { weightUnit } = useSettings();
  const insets = useSafeAreaInsets();

  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(noonOf(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: entryId ? 'Edit check-in' : 'Add check-in' });
    if (!entryId) return;
    getWeightEntry(entryId)
      .then((e) => {
        if (!e) {
          router.back();
          return;
        }
        setWeight(formatNumber(kgToDisplay(e.weightKg, weightUnit)));
        setDate(new Date(e.measuredAt));
        setNote(e.note);
      })
      .catch(reportError);
  }, [entryId]);

  const today = noonOf(new Date());
  const yesterday = noonOf(new Date(Date.now() - 24 * 3600 * 1000));
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function pickDate() {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, selected) => {
        if (event.type === 'set' && selected) setDate(noonOf(selected));
      },
    });
  }

  async function handleSave() {
    const check = validateBodyWeight(weight);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (date.getTime() > Date.now() + 24 * 3600 * 1000) {
      setError('The date cannot be in the future.');
      return;
    }
    setSaving(true);
    try {
      const values = {
        measuredAt: noonOf(date).toISOString(),
        weightKg: displayToKg(check.value, weightUnit),
        note: note.trim(),
      };
      if (entryId) await updateWeightEntry(entryId, values);
      else await addWeightEntry(values);
      router.back();
    } catch (e) {
      setSaving(false);
      reportError(e);
    }
  }

  function handleDelete() {
    confirmAction({
      title: 'Delete this check-in?',
      message: 'It will be removed from your weight log. If it was your newest entry, the one before it becomes your current weight.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteWeightEntry(entryId);
          router.back();
        } catch (e) {
          reportError(e);
        }
      },
    });
  }

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <TextField
        label={`Weight (${weightUnit})`}
        value={weight}
        onChangeText={(t) => {
          setWeight(t);
          setError(null);
        }}
        keyboardType="decimal-pad"
        placeholder="e.g. 78.5"
        error={error}
        autoFocus={!entryId}
      />

      <Text style={styles.label}>Date</Text>
      <Text style={styles.date} accessibilityLiveRegion="polite">
        {formatDate(date.toISOString())}
      </Text>
      <View style={styles.dateRow}>
        <Button
          title="Today"
          variant={sameDay(date, today) ? 'primary' : 'secondary'}
          compact
          onPress={() => setDate(today)}
          style={styles.dateBtn}
        />
        <Button
          title="Yesterday"
          variant={sameDay(date, yesterday) ? 'primary' : 'secondary'}
          compact
          onPress={() => setDate(yesterday)}
          style={styles.dateBtn}
        />
        {Platform.OS === 'android' ? (
          <Button title="Pick date" icon="calendar-outline" variant="secondary" compact onPress={pickDate} style={styles.dateBtn} />
        ) : null}
      </View>

      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. after workout" maxLength={80} />

      <Button title={entryId ? 'Save changes' : 'Save check-in'} icon="checkmark" onPress={handleSave} loading={saving} />
      {entryId ? <Button title="Delete check-in" icon="trash-outline" variant="danger" onPress={handleDelete} style={{ marginTop: spacing.sm }} /> : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  date: { fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  dateRow: { flexDirection: 'row', marginBottom: spacing.lg },
  dateBtn: { flex: 1, marginRight: spacing.sm, borderRadius: radius.md },
});
