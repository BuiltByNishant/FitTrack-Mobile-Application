import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

// Two-option selector. The selected option has a check icon, not just a different color.
export default function Segment({ label, options, value, onChange }) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.id)}
            style={[styles.segBtn, on && styles.segBtnOn]}
          >
            {on ? <Ionicons name="checkmark-circle" size={18} color={colors.white} style={{ marginRight: 6 }} /> : null}
            <Text style={[styles.segText, on && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', marginBottom: spacing.md },
  segBtn: {
    flex: 1,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  segBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: 14, fontWeight: '800', color: colors.text },
});
