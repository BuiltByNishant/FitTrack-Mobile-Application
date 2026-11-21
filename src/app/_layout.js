import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { getDb } from '../db/database';
import { SettingsProvider } from '../context/SettingsContext';
import { configureNotificationHandler, syncReminder } from '../notifications/reminder';
import { Button } from '../components/ui';
import { colors } from '../theme';

// Runs once when the app starts, outside any component.
configureNotificationHandler();

export default function RootLayout() {
  const [state, setState] = useState({ status: 'loading', error: null });

  function openDatabase() {
    setState({ status: 'loading', error: null });
    getDb()
      .then(async () => {
        try {
          await syncReminder();
        } catch (e) {
          console.warn('Could not sync reminder', e);
        }
        setState({ status: 'ready', error: null });
      })
      .catch((error) => setState({ status: 'error', error }));
  }

  useEffect(openDatabase, []);

  if (state.status !== 'ready') {
    return (
      <View style={styles.center}>
        {state.status === 'loading' ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.text}>Opening your workout data…</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Could not open the database</Text>
            <Text style={styles.text}>{String(state.error?.message ?? state.error)}</Text>
            <Button title="Try again" onPress={openDatabase} style={{ marginTop: 16, alignSelf: 'stretch' }} />
          </>
        )}
      </View>
    );
  }

  return (
    <KeyboardProvider>
      <StatusBar style="dark" />
      <SettingsProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '800', color: colors.text },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
          <Stack.Screen name="session/[id]" options={{ title: 'Workout details' }} />
          <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
          <Stack.Screen name="weight-entry" options={{ title: 'Weight check-in', presentation: 'modal' }} />
          <Stack.Screen name="builder" options={{ title: 'Workout' }} />
          <Stack.Screen name="routine/[id]" options={{ title: 'My workout' }} />
          <Stack.Screen name="picker" options={{ title: 'Add exercise', presentation: 'modal' }} />
        </Stack>
      </SettingsProvider>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: 15, color: colors.muted, marginTop: 12, textAlign: 'center' },
});
