import { LegendList } from "@legendapp/list/react-native";
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Image } from 'expo-image';
import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { EMOJI_ASSETS, EMOJI_NAMES } from '../utils/emojiResolver';
import { FlexText } from './FlexText';


interface EmojiSelectorSheetProps {
    onSelect: (emojiName: string) => void;
    theme: 'light' | 'dark';
    colors: any;
    onDismiss?: () => void;
}

const EmojiCell = React.memo(({ item, width, onSelect }: { item: string; width: number; onSelect: (emoji: string) => void }) => {
    return (
        <TouchableOpacity
            style={[styles.emojiItem, { width }]}
            onPress={() => onSelect(item)}
        >
            <Image
                source={EMOJI_ASSETS[item]}
                style={styles.emojiImage}
                contentFit="cover"
                autoplay={true}
                allowDownscaling
                enforceEarlyResizing
                recyclingKey={item}
            />
        </TouchableOpacity>
    );
});

EmojiCell.displayName = 'EmojiCell';

export const EmojiSelectorSheet = forwardRef<TrueSheet, EmojiSelectorSheetProps>(
    ({ onSelect, theme, colors, onDismiss }, ref) => {
        const { width: windowWidth } = useWindowDimensions();
        // Left & right edge spacing: 16. Total edge spacing = 32.
        // Between items: 12. Total gaps (2 gaps for 3 columns) = 24.
        // Total horizontal space for layout details = 32 + 24 = 56.
        const itemWidth = Math.floor((windowWidth - 56) / 3);

        const renderItem = useCallback(({ item }: { item: string }) => {
            return (
                <EmojiCell
                    item={item}
                    width={itemWidth}
                    onSelect={onSelect}
                />
            );
        }, [onSelect, itemWidth]);

        return (
            <TrueSheet
                ref={ref}
                scrollable
                detents={[0.8]}
                cornerRadius={32}
                backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                grabberOptions={{ color: colors.muted || '#C4C4C4', height: 5, width: 40 }}
                onDidDismiss={onDismiss}
            >
                <View style={styles.header}>
                    <FlexText style={[{ fontSize: 20, color: colors.text, fontWeight: 'bold' }]}>月薪喵</FlexText>
                </View>
                <LegendList
                    data={EMOJI_NAMES}
                    keyExtractor={(item) => item}
                    renderItem={renderItem}
                    numColumns={3}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    recycleItems
                />
            </TrueSheet>
        );
    }
);

EmojiSelectorSheet.displayName = 'EmojiSelectorSheet';

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 10, // 10 padding + 6 item margin = 16 edge spacing
        paddingTop: 12,
        paddingBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 4,
        gap: 10,
    },
    emojiItem: {
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderRadius: 12,
        marginHorizontal: 6, // 6 margin on each side = 12 gap between items
        marginBottom: 12,
    },
    emojiImage: {
        width: '80%',
        height: '80%',
    },
});
