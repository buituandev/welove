import React from "react";
import { View } from "react-native";

export const renderFooter = ({ isFetchingNextPage, colors, styles, renderProfileSkeleton }: { isFetchingNextPage: boolean, colors: any, styles: any, renderProfileSkeleton: any }) => {
    if (!isFetchingNextPage) return null;
    return (
        <View style={{ paddingVertical: 20 }}>
            {renderProfileSkeleton({ colors, styles, isFirst: true, isLast: true })}
        </View>
    );
};
