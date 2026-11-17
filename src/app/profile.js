import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button, FieldError, SectionTitle, TextField, reportError } from '../components/ui';
import Segment from '../components/Segment';
import { useSettings } from '../context/SettingsContext';
import { getProfile, saveProfile } from '../repo/profile';
import { listWeightEntries, saveTodayWeight } from '../repo/weight';
import { currentWeight, noonOf } from '../services/progressService';
import { useFocusLoad } from '../utils/helpers';
import { cmToFeetInches, displayToKg, formatNumber, kgToDisplay } from '../utils/units';
import { validateBodyWeight, validateFeetInches, validateHeightCm, validateName } from '../utils/validation';

const weightText = (kg, unit) => (kg == null ? '' : formatNumber(kgToDisplay(kg, unit)));

export default function ProfileScreen() {
  const { weightUnit, heightUnit, setWeightUnit, setHeightUnit } = useSettings();
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, entries] = await Promise.all([getProfile(), listWeightEntries()]);
    const latest = currentWeight(entries);
    setName(p.displayName);
    if (p.heightCm != null) {
      setHeightCm(formatNumber(p.heightCm));
      const { ft, inches: inch } = cmToFeetInches(p.heightCm);
      setFeet(String(ft));
      setInches(String(inch));
    } else {
      setHeightCm('');
      setFeet('');
      setInches('');
    }
    setCurrent(weightText(latest?.weightKg, p.weightUnit));
    setTarget(weightText(p.targetWeightKg, p.weightUnit));
    setLoaded(true);
  }, []);
  useFocusLoad(load);

  // Changing units converts what is typed (when it is valid); saved values stay in kg and cm.
  function changeWeightUnit(next) {
    if (next === weightUnit) return;
    const convert = (text) => {
      const v = validateBodyWeight(text, { required: false });
      if (!v.ok || v.value == null) return text;
      return formatNumber(kgToDisplay(displayToKg(v.value, weightUnit), next));
    };
    setCurrent(convert(current));
    setTarget(convert(target));
    setWeightUnit(next);
  }

  function changeHeightUnit(next) {
    if (next === heightUnit) return;
    if (next === 'ftin') {
      const v = validateHeightCm(heightCm);
      if (v.ok && v.value != null) {
        const f = cmToFeetInches(v.value);
        setFeet(String(f.ft));
        setInches(String(f.inches));
      }
    } else {
      const v = validateFeetInches(feet, inches);
      if (v.ok && v.value != null) setHeightCm(formatNumber(v.value));
    }
    setHeightUnit(next);
  }

  async function handleSave() {
    const found = {};
    const nameCheck = name.trim() ? validateName(name, 'Display name') : { ok: true, value: '' };
    if (!nameCheck.ok) found.name = nameCheck.error;

    const heightCheck = heightUnit === 'cm' ? validateHeightCm(heightCm) : validateFeetInches(feet, inches);
    if (!heightCheck.ok) found.height = heightCheck.error;

    const currentCheck = validateBodyWeight(current, { required: false });
    if (!currentCheck.ok) found.current = currentCheck.error;
    const targetCheck = validateBodyWeight(target, { required: false });
    if (!targetCheck.ok) found.target = targetCheck.error;

    setErrors(found);
    setSavedMessage(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await saveProfile({
        displayName: nameCheck.value,
        heightCm: heightCheck.value,
        targetWeightKg: targetCheck.value == null ? null : displayToKg(targetCheck.value, weightUnit),
      });
      if (currentCheck.value != null) {
        const kg = displayToKg(currentCheck.value, weightUnit);
        const entries = await listWeightEntries();
        const latest = currentWeight(entries);
        if (!latest || Math.abs(latest.weightKg - kg) > 0.005) {
          await saveTodayWeight(kg, noonOf(new Date()).toISOString());
        }
      }
      await load();
      setSavedMessage('Profile saved on this phone.');
    } catch (e) {
      reportError(e);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <View style={styles.screen} />;

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl * 2 }]}
    >
      <Text style={styles.intro}>Everything here is optional and stays on this phone. You can change or clear it any time.</Text>

      <TextField
        label="Display name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, name: null }));
        }}
        placeholder="e.g. Alex"
        maxLength={40}
        error={errors.name}
      />

      <SectionTitle>Height</SectionTitle>
      <Segment
        label="Height unit"
        options={[
          { id: 'cm', label: 'Centimetres' },
          { id: 'ftin', label: 'Feet and inches' },
        ]}
        value={heightUnit}
        onChange={changeHeightUnit}
      />
      {heightUnit === 'cm' ? (
        <TextField
          label="Height (cm)"
          value={heightCm}
          onChangeText={(t) => {
            setHeightCm(t);
            setErrors((e) => ({ ...e, height: null }));
          }}
          keyboardType="decimal-pad"
          placeholder="e.g. 175"
          error={errors.height}
        />
      ) : (
        <View style={{ marginBottom: spacing.md }}>
          <View style={styles.ftRow}>
            <TextField
              label="Feet"
              value={feet}
              onChangeText={(t) => {
                setFeet(t);
                setErrors((e) => ({ ...e, height: null }));
              }}
              keyboardType="number-pad"
              placeholder="5"
              style={{ flex: 1, marginRight: spacing.md, marginBottom: 0 }}
            />
            <TextField
              label="Inches"
              value={inches}
              onChangeText={(t) => {
                setInches(t);
                setErrors((e) => ({ ...e, height: null }));
              }}
              keyboardType="decimal-pad"
              placeholder="9"
              style={{ flex: 1, marginBottom: 0 }}
            />
          </View>
          <FieldError message={errors.height} />
        </View>
      )}

      <SectionTitle>Weight</SectionTitle>
      <Segment
        label="Weight unit"
        options={[
          { id: 'kg', label: 'Kilograms' },
          { id: 'lb', label: 'Pounds' },
        ]}
        value={weightUnit}
        onChange={changeWeightUnit}
      />
      <TextField
        label={`Current weight (${weightUnit})`}
        value={current}
        onChangeText={(t) => {
          setCurrent(t);
          setErrors((e) => ({ ...e, current: null }));
        }}
        keyboardType="decimal-pad"
        placeholder="e.g. 78.5"
        error={errors.current}
      />
      <TextField
        label={`Target weight (${weightUnit}, optional)`}
        value={target}
        onChangeText={(t) => {
          setTarget(t);
          setErrors((e) => ({ ...e, target: null }));
        }}
        keyboardType="decimal-pad"
        placeholder="Leave blank for no target"
        error={errors.target}
      />
      <Text style={styles.hint}>Saving a current weight adds today's check-in to your Weight log. The newest check-in is always your current weight.</Text>

      <Button title="Save profile" icon="checkmark" onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
      {savedMessage ? (
        <View style={styles.msg} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.msgText}>{savedMessage}</Text>
        </View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  intro: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  hint: { fontSize: 13, color: colors.muted },
  ftRow: { flexDirection: 'row' },
  msg: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#ECFDF5' },
  msgText: { marginLeft: spacing.sm, color: colors.success, fontWeight: '800', flexShrink: 1 },
});
