import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { formatShortDate } from '../utils/dates';
import { kgToDisplay } from '../utils/units';

const MAX_BAR = 90;
const MIN_BAR = 24;

// Simple trend: one bar per check-in (oldest to newest) with the value written above each bar.
// Bars are scaled to the range of the shown entries, so read the numbers for exact values.
export default function WeightTrend({ points, unit }) {
  if (points.length < 2) return null;
  const values = points.map((p) => kgToDisplay(p.weightKg, unit));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const summary = points
    .map((p, i) => `${formatShortDate(p.measuredAt)}, ${values[i]} ${unit}`)
    .join('; ');

  return (
    <View accessible accessibilityLabel={`Weight trend, oldest to newest: ${summary}`}>
      <View style={styles.chart}>
        {points.map((p, i) => {
          const h = max === min ? (MAX_BAR + MIN_BAR) / 2 : MIN_BAR + ((values[i] - min) / (max - min)) * (MAX_BAR - MIN_BAR);
          const latest = i === points.length - 1;
          return (
            <View key={p.id} style={styles.col}>
              <Text style={styles.value}>{values[i]}</Text>
              <View style={[styles.bar, { height: h }, latest && styles.barLatest]} />
              <Text style={styles.date}>{formatShortDate(p.measuredAt)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.note}>Weight ({unit}), oldest to newest. The dark bar is your latest entry.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: MAX_BAR + 50 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 22, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#5EEAD4' },
  barLatest: { backgroundColor: colors.primary },
  value: { fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 3 },
  date: { fontSize: 10, color: colors.muted, marginTop: 4 },
  note: { fontSize: 12, color: colors.muted, marginTop: 8 },
});
