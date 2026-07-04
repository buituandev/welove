import React from "react";
import { View } from "react-native";
import { TFunction } from "i18next";
import { FlexText } from "../FlexText";

interface SearchEmptyProps {
    colors: any;
    styles: any;
    common: any;
    searchQuery: string;
    isAdmin?: boolean;
    t: TFunction;
}

export const renderEmptyState = ({ colors, styles, common, searchQuery, isAdmin = false, t }: SearchEmptyProps) => (
    <View style={styles.emptyState}>
        <FlexText
            style={[
                common.heading,
                { color: colors.onSurfaceVariant, textAlign: "center", marginTop: 16 },
            ]}
        >
            {searchQuery
                ? t('search.empty.titleNoResults')
                : isAdmin
                    ? t('search.empty.titleNoPeople')
                    : t('search.empty.titleSearchPeople')}
        </FlexText>
        <FlexText
            style={[
                common.bodySmall,
                {
                    color: colors.onSurfaceVariant,
                    textAlign: "center",
                    marginTop: 8,
                    opacity: 0.7,
                },
            ]}
        >
            {searchQuery
                ? t('search.empty.subtitleNoProfilesMatch', { query: searchQuery })
                : isAdmin
                    ? t('search.empty.subtitleNoProfilesAvailable')
                    : t('search.empty.subtitleTypeName')}
        </FlexText>
    </View>
);