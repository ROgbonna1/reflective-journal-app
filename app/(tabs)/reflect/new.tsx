import { Stack, router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { db } from '@/db';
import * as reflections from '@/db/repos/reflections';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function NewReflectionScreen() {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const inputColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'icon');
  const inputBorder = useThemeColor({}, 'icon');

  const canSave = body.trim().length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await reflections.create(db, {
        id: randomUUID(),
        body: body.trim(),
        mood: mood ?? undefined,
        energy: energy ?? undefined,
        intensity: intensity ?? undefined,
      });
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Could not save', msg);
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerRight: () => <Button title="Save" onPress={handleSave} disabled={!canSave} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="defaultSemiBold">How did it go?</ThemedText>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What stood out, what clicked, what didn't…"
          placeholderTextColor={placeholderColor}
          multiline
          autoFocus
          style={[styles.bodyInput, { color: inputColor, borderColor: inputBorder }]}
        />

        <RatingRow label="Mood" value={mood} onChange={setMood} />
        <RatingRow label="Energy" value={energy} onChange={setEnergy} />
        <RatingRow label="Intensity" value={intensity} onChange={setIntensity} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface RatingRowProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}

function RatingRow({ label, value, onChange }: RatingRowProps) {
  const dotBorder = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={styles.ratingRow}>
      <ThemedText style={styles.ratingLabel}>{label}</ThemedText>
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value !== null && n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              hitSlop={6}
              style={[
                styles.dot,
                { borderColor: dotBorder },
                selected && { backgroundColor: tint, borderColor: tint },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 20,
    gap: 24,
  },
  bodyInput: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontSize: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
});
