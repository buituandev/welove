import { getPreviewData } from "@flyerhq/react-native-link-preview";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { ThemeColors } from "../../context/ThemeContext";
import { Link } from "../../types/post";
import { FlexText } from "../FlexText";
import { createStyles } from "./styles";

import { Spinner } from "heroui-native/spinner";

// ─── Shared OG cache (mirrors PostLinkPreview – same module-level maps) ───────
// Imported lazily so the two modules share one cache at runtime.
// We re-declare the maps here only for the label-suggest path; if PostLinkPreview
// has already cached a URL we benefit automatically because JS modules are
// singletons.
//
// To truly share the cache we piggyback on getPreviewData directly (same as
// PostLinkPreview) and use our own local lightweight cache for the create screen.
const _ogCache = new Map<string, { title?: string } | null>();
const _ogInflight = new Map<string, Promise<{ title?: string } | null>>();

async function fetchLabelSuggestion(
    url: string,
): Promise<string | null> {
    if (_ogCache.has(url)) return _ogCache.get(url)?.title ?? null;
    if (_ogInflight.has(url)) {
        const r = await _ogInflight.get(url)!;
        return r?.title ?? null;
    }

    const p = getPreviewData(url, 6000)
        .then((d) => {
            const v = d?.title ? { title: d.title } : null;
            _ogCache.set(url, v);
            return v;
        })
        .catch(() => {
            _ogCache.set(url, null);
            return null;
        })
        .finally(() => _ogInflight.delete(url));

    _ogInflight.set(url, p);
    const result = await p;
    return result?.title ?? null;
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Given whatever the user typed, return a properly-prefixed URL string.
 * - Already has a scheme  → untouched
 * - Starts with "//"      → prepend "https:"
 * - Otherwise             → prepend "https://"
 */
function normalizeUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed; // has scheme
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return `https://${trimmed}`;
}

/**
 * Lightweight structural validation — no network required.
 * Returns true for URLs that look plausible (has host with a dot, not just IP-ish, etc.).
 */
function looksLikeValidUrl(url: string): boolean {
    try {
        const u = new URL(url);
        // Must be http(s) and have at least one dot in the hostname (or be localhost)
        return (
            (u.protocol === "https:" || u.protocol === "http:") &&
            (u.hostname.includes(".") || u.hostname === "localhost")
        );
    } catch {
        return false;
    }
}

// ─── LinkItem ─────────────────────────────────────────────────────────────────

interface LinkItemProps {
    link: Link;
    index: number;
    onUpdate: (field: keyof Link, value: string) => void;
    onRemove: () => void;
    colors: ThemeColors;
    common: any;
}

const LinkItem = memo(({
    link,
    onUpdate,
    onRemove,
    colors,
    common,
}: LinkItemProps) => {
    const { t } = useTranslation();

    // Always keep a ref to the latest onUpdate so async callbacks never call
    // a stale closure even if the parent recreates the function between the
    // URL update and the awaited label-suggest completing.
    const latestOnUpdate = useRef(onUpdate);
    React.useEffect(() => { latestOnUpdate.current = onUpdate; }, [onUpdate]);

    // ── local url draft (what the TextInput shows while typing) ───────────────
    // We keep a local draft so we can show the raw text while the user types,
    // then normalise + validate only on blur.
    const [urlDraft, setUrlDraft] = useState(link.url);
    const [isFetchingLabel, setIsFetchingLabel] = useState(false);
    const [urlValid, setUrlValid] = useState<boolean | null>(
        link.url ? looksLikeValidUrl(link.url) : null,
    );
    // Track last url we normalised so we don't re-trigger on re-renders
    const lastNormalized = useRef(link.url);

    // Sync external prop changes (e.g. when parent resets state)
    // Only sync if it's a meaningful external change, not our own blur normalization
    React.useEffect(() => {
        if (link.url !== lastNormalized.current) {
            setUrlDraft(link.url);
            lastNormalized.current = link.url;
            setUrlValid(link.url ? looksLikeValidUrl(link.url) : null);
        }
    }, [link.url]);

    // ── URL blur handler ──────────────────────────────────────────────────────
    const handleUrlBlur = useCallback(async () => {
        const raw = urlDraft.trim();
        if (!raw) {
            onUpdate("url", "");
            setUrlValid(null);
            return;
        }

        const normalized = normalizeUrl(raw);
        const valid = looksLikeValidUrl(normalized);

        setUrlValid(valid);

        // Update draft to show normalized form
        setUrlDraft(normalized);
        lastNormalized.current = normalized;
        onUpdate("url", normalized);

        // Only attempt label fetch when:
        //   1. URL looks valid
        //   2. User hasn't already typed a label
        if (valid && !link.label.trim()) {
            setIsFetchingLabel(true);
            try {
                const suggested = await fetchLabelSuggestion(normalized);
                if (suggested) {
                    // Use ref so we always call the freshest onUpdate, not the
                    // stale one captured when handleUrlBlur was last created.
                    latestOnUpdate.current("label", suggested);
                }
            } finally {
                setIsFetchingLabel(false);
            }
        }
    }, [urlDraft, link.label, onUpdate]);

    // ── Validity indicator colour ─────────────────────────────────────────────
    const urlBorderColor =
        urlValid === false
            ? colors.error
            : urlValid === true
                ? colors.primary
                : colors.outlineVariant;

    return (
        <View
            style={[
                createStyles.linkItemContainer,
                { backgroundColor: colors.surfaceContainer },
            ]}
        >
            <View style={createStyles.linkInputsContainer}>
                {/* ── URL input (first, so the keyboard flow is URL → label) ── */}
                <View>
                    <TextInput
                        style={[
                            createStyles.linkInput,
                            common.body,
                            {
                                color: colors.onSurface,
                                borderColor: urlBorderColor,
                                borderWidth: 1,
                            },
                        ]}
                        placeholder={t("create.form.linkUrlPlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={urlDraft}
                        onChangeText={setUrlDraft}
                        onBlur={handleUrlBlur}
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        textContentType="URL"
                    />
                    {/* Validity pill */}
                    {urlValid === false && (
                        <View style={linkStyles.validityPill}>
                            <Text style={[linkStyles.validityText, { color: colors.error }]}>
                                ✕ Invalid URL
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Label input ───────────────────────────────────────────── */}
                <View style={linkStyles.labelRow}>
                    <TextInput
                        style={[
                            createStyles.linkInput,
                            common.body,
                            {
                                color: colors.onSurface,
                                borderColor: colors.outlineVariant,
                                borderWidth: 1,
                                flex: 1,
                            },
                        ]}
                        placeholder={t("create.form.linkLabelPlaceholder")}
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={link.label}
                        onChangeText={(text) => onUpdate("label", text)}
                        returnKeyType="done"
                    />
                    {isFetchingLabel && (
                        <Spinner
                            size="sm"
                            color={colors.onSurfaceVariant}
                            style={linkStyles.labelSpinner}
                        />
                    )}
                </View>
            </View>

            {/* ── Remove button ─────────────────────────────────────────────── */}
            <TouchableOpacity
                style={[
                    createStyles.removeLinkButton,
                    { backgroundColor: colors.errorContainer },
                ]}
                onPress={onRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="close" size={14} color={colors.onErrorContainer} />
            </TouchableOpacity>
        </View>
    );
});

LinkItem.displayName = "LinkItem";

const linkStyles = StyleSheet.create({
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    labelSpinner: {
        position: "absolute",
        right: 10,
    },
    validityPill: {
        marginTop: 3,
        paddingHorizontal: 4,
    },
    validityText: {
        fontSize: 11,
        fontWeight: "500",
    },
});

// ============================================================================
// LinksSection Component
// ============================================================================

interface LinksSectionProps {
    visible: boolean;
    links: Link[];
    colors: ThemeColors;
    common: any;
    onUpdateLink: (index: number, field: keyof Link, value: string) => void;
    onRemoveLink: (index: number) => void;
}

export const LinksSection = memo(({
    visible,
    links,
    colors,
    common,
    onUpdateLink,
    onRemoveLink,
}: LinksSectionProps) => {
    const { t } = useTranslation();

    if (!visible || links.length === 0) return null;

    return (
        <View style={createStyles.linksSection}>
            <FlexText
                style={[common.label, { color: colors.onSurface, marginBottom: 12 }]}
            >
                {t("create.form.links")}
            </FlexText>
            {links.map((link, index) => (
                <LinkItem
                    key={index}
                    link={link}
                    index={index}
                    onUpdate={(field, value) => onUpdateLink(index, field, value)}
                    onRemove={() => onRemoveLink(index)}
                    colors={colors}
                    common={common}
                />
            ))}
        </View>
    );
});

LinksSection.displayName = "LinksSection";
