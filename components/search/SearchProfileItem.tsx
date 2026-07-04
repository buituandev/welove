import VerifiedIcon from "@/icons/verified";
import { Profile } from "@/types/profile";
import { calculateAge } from "@/utils/timeandage";
import { Avatar } from "heroui-native/avatar";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CustomSurface } from "../CustomSurface";
import { FlexText } from "../FlexText";

interface SearchProfileItemProps {
    item: Profile;
    colors: any;
    styles: any;
    common: any;
    navigation: any;
    onPress?: (item: Profile) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export const SearchProfileItem = React.memo(({
    item,
    colors,
    styles,
    common,
    navigation,
    onPress,
    isFirst,
    isLast,
}: SearchProfileItemProps) => {
    const { t } = useTranslation();

    const handlePress = () => {
        if (onPress) {
            onPress(item);
        } else {
            navigation.push({
                pathname: "/profile/[id]",
                params: { id: item.id, isMe: "false" },
            });
        }
    };

    return (
        <CustomSurface
            isFirst={isFirst}
            isLast={isLast}
            onPress={handlePress}
            style={styles.profileCard}
        >
            <Avatar style={styles.avatar}>
                <Avatar.Image source={{ uri: item.avatar_url }} />
                <Avatar.Fallback>{item.name?.[0] || 'U'}</Avatar.Fallback>
            </Avatar>
            <View style={styles.profileInfo}>
                <View style={[common.row, { gap: 4 }]}>
                    <FlexText
                        style={[common.subheading, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </FlexText>
                    {item.is_verified && (
                        <VerifiedIcon size={14} />
                    )}
                </View>
                {item.username ? (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        @{item.username}
                    </FlexText>
                ) : item.bio ? (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {item.bio}
                    </FlexText>
                ) : null}
                {item.birthday && (
                    <FlexText
                        style={[common.caption, { color: colors.muted, marginTop: 2 }]}
                        numberOfLines={1}
                    >
                        {t('search.profile.yearsOld', { count: calculateAge(item.birthday) })}
                    </FlexText>
                )}
            </View>
            <View style={[styles.viewButton, { backgroundColor: colors.card }]}>
                <FlexText style={[common.label, { color: colors.text, fontSize: 12 }]}>
                    {t('search.profile.view')}
                </FlexText>
            </View>
        </CustomSurface>
    );
});

SearchProfileItem.displayName = 'SearchProfileItem';

