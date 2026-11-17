import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { deleteSession, getActiveSession, startSessionFromCustomWorkout, startSessionFromTemplate } from '../repo/sessions';
import { reportError } from '../components/ui';

// Runs `loader` every time the screen comes into focus, so screens always show saved data.
export function useFocusLoad(loader) {
  useFocusEffect(
    useCallback(() => {
      loader().catch(reportError);
    }, [loader])
  );
}

// Starts a built-in template ({ template }) or a saved custom workout ({ customId }) and opens the active workout screen.
// If an unfinished workout exists, the person chooses to resume it or replace it.
export async function beginWorkout(target) {
  try {
    const active = await getActiveSession();
    const open = async () => {
      try {
        const id = target.customId != null ? await startSessionFromCustomWorkout(target.customId) : await startSessionFromTemplate(target.template);
        router.push(`/workout/${id}`);
      } catch (e) {
        reportError(e);
      }
    };
    if (!active) {
      await open();
      return;
    }
    Alert.alert('Workout in progress', 'You have an unfinished workout. Resume it, or discard it and start a new one?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resume it', onPress: () => router.push(`/workout/${active.id}`) },
      {
        text: 'Discard and start new',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(active.id);
          } catch (e) {
            reportError(e);
            return;
          }
          await open();
        },
      },
    ]);
  } catch (e) {
    reportError(e);
  }
}
