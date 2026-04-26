import { Stack } from 'expo-router';

export default function ReflectStackLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name="index" options={{ title: 'Reflect' }} />
      <Stack.Screen
        name="new"
        options={{
          presentation: 'modal',
          headerLargeTitle: false,
          title: 'New reflection',
        }}
      />
    </Stack>
  );
}
