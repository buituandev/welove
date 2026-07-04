/**
 * SearchHistoryPills
 *
 * Shows up to 3 recent search queries as pill-shaped chips stacked vertically
 * above the search bar. Appears only when the search input is focused and
 * history is non-empty.
 *
 * Props:
 *   - queries   : string[]        — recent queries (newest first, max 3)
 *   - onSelect  : (q) => void     — fills the search input with this query
 *   - onRemove  : (q) => void     — deletes a single query from history
 *   - colors    : theme colors from ThemeContext
 */

import Ionicons from '@react-native-vector-icons/ionicons/static';
import { CloseButton } from 'heroui-native/close-button';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SearchHistoryPillsProps {
  queries: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  colors: any;
}

export const SearchHistoryPills: React.FC<SearchHistoryPillsProps> = ({
  queries,
  onSelect,
  onRemove,
  colors,
}) => {
  if (!queries.length) return null;

  return (
    <View style={styles.wrapper}>
      {queries.map((q) => (
        <View key={q} style={styles.row}>
          <Pressable
            onPress={() => onSelect(q)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: colors.surfaceContainerHighest,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.onSurface}
              style={styles.icon}
            />
            <Text
              style={[styles.pillText, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {q}
            </Text>
            <CloseButton
              onPress={() => onRemove(q)}
              iconProps={{ color: colors.primary, size: 16 }}
            />
          </Pressable>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 6,
    alignSelf: 'flex-start',
  },
  icon: {
    opacity: 0.7,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
});
