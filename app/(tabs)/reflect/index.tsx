import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReflectScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Reflect' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Reflect</ThemedText>
        <ThemedText>Reflection feed and capture entry points will live here.</ThemedText>
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
