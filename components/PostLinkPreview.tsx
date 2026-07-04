import Ionicons from "@react-native-vector-icons/ionicons/static";
import { getPreviewData, PreviewData } from '@flyerhq/react-native-link-preview';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ThemeColors } from '../context/ThemeContext';
import { Spinner } from "heroui-native/spinner";

// ─── Module-level cache ───────────────────────────────────────────────────────
// Keyed by URL. Stores the settled PreviewData (or null on error/no-data).
// Lives for the entire app session — same URL in different posts will only
// ever trigger a single network request.
const ogCache = new Map<string, PreviewData | null>();

// Track in-flight promises so parallel mounts of the same URL don't each
// kick off their own fetch.
const ogInflight = new Map<string, Promise<PreviewData | null>>();

async function fetchOGData(url: string, timeout = 6000): Promise<PreviewData | null> {
    if (ogCache.has(url)) return ogCache.get(url)!;

    // Reuse an in-flight promise if one exists for this URL
    if (ogInflight.has(url)) return ogInflight.get(url)!;

    const promise = getPreviewData(url, timeout)
        .then((data) => {
            ogCache.set(url, data ?? null);
            return data ?? null;
        })
        .catch(() => {
            ogCache.set(url, null);
            return null;
        })
        .finally(() => {
            ogInflight.delete(url);
        });

    ogInflight.set(url, promise);
    return promise;
}
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Slightly narrower than screen so the next card peeks through in horizontal scroll.
// Exposed so PostItem can pass it to snapToOffsets if desired.
export const LINK_CARD_WIDTH = Math.min(SCREEN_WIDTH - 56, 340);
const CARD_RADIUS = 14;
const IMAGE_HEIGHT = 180;

interface PostLinkPreviewProps {
    url: string;
    label: string;
    colors: ThemeColors;
    /** Override card width. Defaults to LINK_CARD_WIDTH. */
    cardWidth?: number;
}

export const PostLinkPreview = React.memo(
    ({ url, label, colors, cardWidth = LINK_CARD_WIDTH }: PostLinkPreviewProps) => {
        // 'idle' → 'loading' → 'done'
        const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(() =>
            ogCache.has(url) ? 'done' : 'idle',
        );
        const [data, setData] = useState<PreviewData | null>(() =>
            ogCache.has(url) ? ogCache.get(url)! : null,
        );

        // Keep a ref so the async callback can check if we're still mounted
        const mountedRef = useRef(true);
        useEffect(() => {
            mountedRef.current = true;
            return () => { mountedRef.current = false; };
        }, []);

        useEffect(() => {
            // Already have data from the module cache — nothing to do
            if (ogCache.has(url)) {
                setData(ogCache.get(url)!);
                setStatus('done');
                return;
            }

            setStatus('loading');

            // Defer the network fetch until the browser/JS engine is idle so we
            // never block the thread while the list is actively scrolling.
            // timeout: 2000 ensures the fetch still runs on a consistently busy
            // device rather than starving indefinitely.
            const id = requestIdleCallback(
                async () => {
                    const result = await fetchOGData(url);
                    if (mountedRef.current) {
                        setData(result);
                        setStatus('done');
                    }
                },
                { timeout: 2000 },
            );

            return () => {
                cancelIdleCallback(id);
            };
        }, [url]);

        const handleOpen = useCallback(() => {
            Linking.openURL(url).catch(() => { /* silently ignore */ });
        }, [url]);

        const domain = React.useMemo(() => {
            try { return new URL(url).hostname.replace(/^www\./, ''); }
            catch { return url; }
        }, [url]);

        const hasImage = !!(data?.image?.url);
        const hasTitle = !!(data?.title);
        const hasDescription = !!(data?.description);

        // ── Loading / idle pill ──────────────────────────────────────────────
        if (status !== 'done') {
            return (
                <Pressable
                    onPress={handleOpen}
                    style={[styles.card, {
                        width: cardWidth,
                        backgroundColor: colors.containerContent,
                        borderColor: colors.divider,
                    }]}
                >
                    <View style={styles.loadingRow}>
                        <Spinner size="md" color={colors.muted} />
                        <Text style={[styles.loadingText, { color: colors.muted }]} numberOfLines={1}>
                            {domain}
                        </Text>
                    </View>
                </Pressable>
            );
        }

        // ── Settled card ─────────────────────────────────────────────────────
        return (
            <Pressable
                onPress={handleOpen}
                style={({ pressed }) => [
                    styles.card,
                    {
                        width: cardWidth,
                        backgroundColor: colors.containerContent,
                        borderColor: colors.divider,
                        opacity: pressed ? 0.85 : 1,
                    },
                ]}
            >
                {/* OG banner image */}
                {hasImage && (
                    <Image
                        source={{ uri: data!.image!.url }}
                        style={styles.ogImage}
                        contentFit="cover"
                        transition={200}
                    />
                )}

                <View style={styles.metaContainer}>
                    {/* Domain row */}
                    <View style={styles.domainRow}>
                        <View style={[styles.faviconPlaceholder, { backgroundColor: colors.secondary + '22' }]}>
                            <Ionicons name="globe-outline" size={10} color={colors.secondary} />
                        </View>
                        <Text style={[styles.domainText, { color: colors.secondary }]} numberOfLines={1}>
                            {domain}
                        </Text>

                        {/* Label badge — only when it meaningfully differs from domain */}
                        {!!label && label !== domain && (
                            <View style={[styles.labelBadge, { backgroundColor: colors.secondary + '18' }]}>
                                <Text style={[styles.labelText, { color: colors.secondary }]} numberOfLines={1}>
                                    {label}
                                </Text>
                            </View>
                        )}

                        <Ionicons
                            name="open-outline"
                            size={13}
                            color={colors.muted}
                            style={styles.openIcon}
                        />
                    </View>

                    {/* Title */}
                    {hasTitle && (
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {data!.title}
                        </Text>
                    )}

                    {/* Description */}
                    {hasDescription && (
                        <Text
                            style={[styles.description, { color: colors.muted }]}
                            numberOfLines={hasImage ? 2 : 3}
                        >
                            {data!.description}
                        </Text>
                    )}

                    {/* Fallback — no metadata available */}
                    {!hasTitle && !hasDescription && (
                        <Text style={[styles.fallbackUrl, { color: colors.muted }]} numberOfLines={2}>
                            {url}
                        </Text>
                    )}
                </View>
            </Pressable>
        );
    },
    // Only re-render when the url, label, or theme colors object reference changes.
    // Since ThemeContext memoises its colors object this is effectively only on
    // theme switch — not on every FlatList re-render.
    (prev, next) =>
        prev.url === next.url &&
        prev.label === next.label &&
        prev.cardWidth === next.cardWidth &&
        prev.colors === next.colors,
);

PostLinkPreview.displayName = 'PostLinkPreview';

const styles = StyleSheet.create({
    card: {
        width: LINK_CARD_WIDTH, // overridden inline via style prop
        borderRadius: CARD_RADIUS,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
        marginBottom: 8,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    loadingText: {
        fontSize: 13,
        flex: 1,
    },
    ogImage: {
        width: '100%',
        height: IMAGE_HEIGHT,
    },
    metaContainer: {
        paddingHorizontal: 14,
        paddingTop: 11,
        paddingBottom: 13,
        gap: 5,
    },
    domainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    faviconPlaceholder: {
        width: 16,
        height: 16,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    domainText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.2,
        flexShrink: 1,
    },
    labelBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        maxWidth: 120,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
    openIcon: {
        marginLeft: 'auto' as any,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        letterSpacing: -0.1,
    },
    description: {
        fontSize: 12,
        lineHeight: 17,
    },
    fallbackUrl: {
        fontSize: 12,
        lineHeight: 17,
    },
});
