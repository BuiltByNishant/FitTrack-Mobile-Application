import React, { useCallback, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { EmptyState } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext';
import { listCompletedSessions } from '../../repo/sessions';
import { useFocusLoad } from '../../utils/helpers';
import { dayKey, formatDate, formatDuration, formatTime } from '../../utils/dates';
import { formatWeight } from '../../utils/units';

function groupByDay(sessions) {
  const groups = [];
  for (const s of sessions) {
    const key = dayKey(s.startedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.data.push(s);
    else groups.push({ key, title: formatDate(s.startedAt), data: [s] });
  }
  return groups;
}

export default function HistoryScreen() {
  const { weightUnit } = useSettings();
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setSections(groupByDay(await listCompletedSessions()));
    setLoaded(true);
  }, []);
  useFocusLoad(load);

  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(s) => String(s.id)}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={
        loaded ? (
          <EmptyState
            icon="time-outline"
            title="No workouts in History"
            message="Finished workouts appear here, newest first."
            actionTitle="Start a workout"
            onAction={() => router.navigate('/workouts')}
          />
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <Text accessibilityRole="header" style={styles.header}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${formatTime(item.startedAt)}, ${item.completedSetCount} of ${item.setCount} sets done. Open details`}
          onPress={() => router.push(`/session/${item.id}`)}
          style={styles.row}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.meta}>
              {formatTime(item.startedAt)} · {formatDuration(new Date(item.endedAt) - new Date(item.startedAt))} · {item.completedSetCount}/
              {item.setCount} sets done
            </Text>
            <Text style={styles.meta}>Volume {formatWeight(item.volumeKg, weightUnit)} (simple logging metric)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { fontSize: 15, fontWeight: '800', color: colors.muted, marginTop: spacing.md, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
