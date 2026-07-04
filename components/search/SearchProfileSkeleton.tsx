import { SkeletonGroup } from "heroui-native/skeleton-group";
import React from "react";
import { View } from "react-native";
import { CustomSurface } from "../CustomSurface";

export const renderProfileSkeleton = ({ colors, styles, isFirst, isLast }: any) => (
    <CustomSurface
        isFirst={isFirst}
        isLast={isLast}
        style={styles.profileCard}
    >
        <SkeletonGroup isLoading={true} variant="shimmer" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <SkeletonGroup.Item
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.outlineVariant,
                }}
            />
            <View style={styles.profileInfo}>
                <SkeletonGroup.Item
                    style={{
                        width: 140,
                        height: 18,
                        borderRadius: 8,
                        backgroundColor: colors.outlineVariant,
                    }}
                />
                <SkeletonGroup.Item
                    style={{
                        width: 100,
                        height: 14,
                        borderRadius: 6,
                        marginTop: 6,
                        backgroundColor: colors.outlineVariant,
                    }}
                />
            </View>
            <SkeletonGroup.Item
                style={{
                    width: 50,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: colors.outlineVariant,
                }}
            />
        </SkeletonGroup>
    </CustomSurface>
);