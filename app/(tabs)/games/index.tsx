import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function GamesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Games' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Games</ThemedText>
        <ThemedText>The 14 seeded games and your custom games will appear here.</ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
});
