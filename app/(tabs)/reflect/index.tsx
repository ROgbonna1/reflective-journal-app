import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/db';
import * as reflections from '@/db/repos/reflections';
import { useThemeColor } from '@/hooks/use-theme-color';

type Reflection = reflections.Reflection;

export default function ReflectFeedScreen() {
  const [items, setItems] = useState<Reflection[] | null>(null);

  // Refetch on every focus so a reflection saved on the modal capture
  // screen is visible the moment the user returns here.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const rows = await reflections.listRecent(db);
        if (!cancelled) setItems(rows);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Reflect',
          headerRight: () => (
            <Link href="/reflect/new" asChild>
              <Pressable hitSlop={10}>
                <ThemedText type="defaultSemiBold" style={styles.plus}>
                  +
                </ThemedText>
              </Pressable>
            </Link>
          ),
        }}
      />
      <ThemedView style={styles.flex}>
        {items === null ? null : items.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <ReflectionRow reflection={item} />}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ThemedView>
    </>
  );
}

function ReflectionRow({ reflection }: { reflection: Reflection }) {
  const meta = formatMeta(reflection);
  return (
    <View style={styles.row}>
      <ThemedText numberOfLines={3} style={styles.body}>
        {reflection.body}
      </ThemedText>
      <ThemedText style={styles.meta}>
        {[meta, relativeTime(reflection.createdAt)].filter(Boolean).join('  ·  ')}
      </ThemedText>
    </View>
  );
}

function Separator() {
  const color = useThemeColor({}, 'icon');
  return <View style={[styles.separator, { backgroundColor: color, opacity: 0.2 }]} />;
}

function EmptyState() {
  return (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText type="title" style={styles.emptyTitle}>
        No reflections yet
      </ThemedText>
      <ThemedText style={styles.emptyHint}>Tap + to write your first.</ThemedText>
      <Link href="/reflect/new" asChild>
        <Pressable style={styles.emptyButton}>
          <ThemedText type="defaultSemiBold">Write a reflection</ThemedText>
        </Pressable>
      </Link>
    </ThemedView>
  );
}

function formatMeta(r: Reflection): string {
  const parts: string[] = [];
  if (r.mood !== null) parts.push(`M ${r.mood}`);
  if (r.energy !== null) parts.push(`E ${r.energy}`);
  if (r.intensity !== null) parts.push(`I ${r.intensity}`);
  return parts.join('  ');
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingVertical: 8 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 6,
  },
  body: { fontSize: 16, lineHeight: 22 },
  meta: { fontSize: 13, opacity: 0.6 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  plus: { fontSize: 28, lineHeight: 28, paddingHorizontal: 4 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: { textAlign: 'center' },
  emptyHint: { textAlign: 'center', opacity: 0.7 },
  emptyButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
  },
});
