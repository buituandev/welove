import { FlexText } from "@/components/FlexText";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { withAlpha, getImageUrl } from "./tvDetailUtils";
import { Image } from "expo-image";

// ─── Dot Separator ───────────────────────────────────────────────────────────
export const DotSep = () => (
    <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
);

// ─── Genre Pill ───────────────────────────────────────────────────────────────
export const GenrePill = ({ name }: { name: string }) => (
    <View style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
        backgroundColor: withAlpha("#FFFFFF", "20"),
        borderWidth: 1, borderColor: withAlpha("#FFFFFF", "30"),
    }}>
        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{name}</Text>
    </View>
);

// ─── Content Rating Pill ──────────────────────────────────────────────────────
export const ContentRatingPill = ({ rating }: { rating: string }) => (
    <View style={{
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
    }}>
        <Text style={{ color: "white", fontSize: 10, fontWeight: "700", opacity: 0.9 }}>{rating}</Text>
    </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
export const InfoRow = ({ label, value, isLink = false }: { label: string; value: string; isLink?: boolean }) => (
    <View style={{ gap: 2 }}>
        <Text style={sharedStyles.label}>{label}</Text>
        {isLink ? (
            <Pressable onPress={() => WebBrowser.openBrowserAsync(value)}>
                <Text style={sharedStyles.link}>{value}</Text>
            </Pressable>
        ) : (
            <Text style={sharedStyles.muted}>{value}</Text>
        )}
    </View>
);

// ─── Section Header (with optional chevron nav) ───────────────────────────────
export const SectionHeader = ({ title, onChevronPress }: { title: string; onChevronPress?: () => void }) => (
    <Pressable
        onPress={onChevronPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
    >
        <FlexText style={[sharedStyles.sectionTitle, { flex: 1 }]}>{title}</FlexText>
        {onChevronPress && (
            <View style={{ backgroundColor: "rgba(52,52,52,1)", padding: 8, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 999 }}>
                <Ionicons name="chevron-forward" size={20} color="white" />
            </View>
        )}
    </Pressable>
);

// ─── Watch Provider Icon ──────────────────────────────────────────────────────
export const WatchProviderIcon = ({ logoPath, providerId }: { logoPath: string | null; providerId: number }) => (
    <Image
        key={providerId}
        source={{ uri: getImageUrl(logoPath, 92) }}
        style={{ width: 32, height: 32, borderRadius: 8 }}
        contentFit="cover"
    />
);

// ─── Shared styles ────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
    sectionTitle: { fontSize: 20, fontWeight: "700", color: "white" },
    label: { fontSize: 14, color: "white" },
    muted: { fontSize: 14, color: "rgba(255, 255, 255, 0.7)" },
    link: { fontSize: 14, color: "#007AFF" },
});
