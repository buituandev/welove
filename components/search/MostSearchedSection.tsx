import VerifiedIcon from '@/icons/verified';
import { LocalProfile } from '@/stores/searchHistory';
import { useMostSearchedViewModel } from '@/viewmodels/MostSearchedViewModel';
import { Image as ExpoImage } from 'expo-image';
import { SquircleView } from 'expo-squircle-view';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { createCommonStyles } from '../../styles/common';
import { FlexText } from '../FlexText';

// ─── Single Profile Card ─────────────────────────────────────────────────────

interface MostSearchedCardProps {
    profile: LocalProfile;
    onPress: (id: string) => void;
    colors: any;
    common: any;
}

const MostSearchedCard = React.memo(({ profile, onPress, colors, common }: MostSearchedCardProps) => (
    <TouchableOpacity
        onPress={() => onPress(profile.id)}
        activeOpacity={0.7}
    >
        <SquircleView
            cornerSmoothing={100}
            preserveSmoothing
            style={[styles.card, { backgroundColor: colors.surfaceContainer }]}

        >
            {profile.avatar_url ? (
                <ExpoImage
                    source={{ uri: profile.avatar_url }}
                    style={styles.avatar}
                    contentFit="cover"
                />
            ) : (
                <ExpoImage
                    source={
                        profile.gender === 'male'
                            ? require('../../assets/images/AV17.png')
                            : profile.gender
                                ? require('../../assets/images/AV86.png')
                                : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                    }
                    style={styles.avatar}
                    contentFit="cover"
                />
            )}
            <View style={styles.textBlock}>
                <View style={styles.nameRow}>
                    <FlexText
                        style={[common.label, { color: colors.onSurface, fontWeight: '600', flexShrink: 1 }]}
                        numberOfLines={1}
                    >
                        {profile.name}
                    </FlexText>
                    {profile.is_verified && (
                        <VerifiedIcon size={12} />
                    )}
                </View>
                {profile.username ? (
                    <FlexText
                        style={[common.caption, { color: colors.onSurfaceVariant }]}
                        numberOfLines={1}
                    >
                        @{profile.username}
                    </FlexText>
                ) : null}
            </View>
        </SquircleView>
    </TouchableOpacity>
));

MostSearchedCard.displayName = 'MostSearchedCard';

// ─── Section ─────────────────────────────────────────────────────────────────

export const MostSearchedSection = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const vm = useMostSearchedViewModel();
    const { t } = useTranslation();

    if (!vm.hasMostSearched) return null;

    const pairs: [LocalProfile, LocalProfile | null][] = [];
    for (let i = 0; i < vm.topProfiles.length; i += 2) {
        pairs.push([vm.topProfiles[i], vm.topProfiles[i + 1] ?? null]);
    }

    return (
        <View style={styles.container}>
            <FlexText style={[common.subheading, { fontSize: 15, marginBottom: 12 }]}>
                {t('search.sections.mostSearched')}
            </FlexText>

            {pairs.map((pair, rowIdx) => (
                <View
                    key={rowIdx}
                    style={[styles.row, rowIdx > 0 && { marginTop: 10 }]}
                >
                    <View style={styles.cardWrapper}>
                        <MostSearchedCard
                            profile={pair[0]}
                            onPress={vm.navigateToProfile}
                            colors={colors}
                            common={common}
                        />
                    </View>
                    <View style={styles.cardWrapper}>
                        {pair[1] ? (
                            <MostSearchedCard
                                profile={pair[1]}
                                onPress={vm.navigateToProfile}
                                colors={colors}
                                common={common}
                            />
                        ) : (
                            <View style={styles.cardPlaceholder} />
                        )}
                    </View>
                </View>
            ))}
        </View>
    );
};

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
    container: {
        paddingBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    cardWrapper: {
        flex: 1,
    },
    cardPlaceholder: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 24,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
    },
    textBlock: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
