import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText>Settings, game management, export, and the LLM API key live here.</ThemedText>
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
