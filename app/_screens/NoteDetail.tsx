import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../../components/FlexText";
import { useThemeContext } from "../../context/ThemeContext";
import { useNote } from "../../services/note";
import { createCommonStyles } from "../../styles/common";

import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { MediaViewer, type MediaViewerItem } from "expo-media-viewer";
import { SquircleView } from "expo-squircle-view";
import { Spinner } from "heroui-native/spinner";


const IMG_PATTERN = /\[<img\s+(.*?)\s*\/>\]/i;
const LINK_PATTERN = /\[<link\s+(.*?)\s*\/>\]/i;
const TOKEN_PATTERN = /(\[<img\s+.*?\s*\/>\]|\[<link\s+.*?\s*\/>\])/gi;

function parseTokens(content: string) {
    const titleMatch = content.match(/\[<title>(.*?)<\/title>\]/i);
    const title = titleMatch ? titleMatch[1] : null;

    const strippedContent = content.replace(/\[<title>.*?<\/title>\]/gi, '');

    const parts = strippedContent.split(TOKEN_PATTERN);
    const elements: any[] = [];
    let imageIndex = 0;
    const imageUrls: string[] = [];

    parts.forEach((part) => {
        if (!part) return;

        const imgMatch = part.match(IMG_PATTERN);
        if (imgMatch) {
            imageUrls.push(imgMatch[1]);
            elements.push({ type: 'image', url: imgMatch[1], imageIndex });
            imageIndex++;
            return;
        }

        const linkMatch = part.match(LINK_PATTERN);
        if (linkMatch) {
            elements.push({ type: 'link', url: linkMatch[1] });
            return;
        }

        const text = part.trim();
        if (text) {
            elements.push({ type: 'text', text });
        }
    });

    return { title, elements, imageUrls };
}

const NoteDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const { t } = useTranslation();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const { data, isLoading } = useNote(Number(id));
    const note = data?.data;

    if (isLoading) {
        return (
            <View style={[common.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <Spinner size="lg" color={colors.text} />
            </View>
        );
    }

    if (!note) {
        return (
            <View style={[common.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <FlexText style={{ color: colors.text }}>{t("notes.detail.notFound")}</FlexText>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <FlexText style={{ color: colors.secondary }}>{t("notes.detail.goBack")}</FlexText>
                </TouchableOpacity>
            </View>
        );
    }

    const { title, elements, imageUrls } = parseTokens(note.content);

    return (
        <View style={common.screen}>
            {/* Floating Header */}
            <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <SquircleView
                        cornerSmoothing={100}
                        preserveSmoothing
                        style={{
                            backgroundColor: colors.containerContent,
                            borderRadius: 20,
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </SquircleView>

                    <SquircleView
                        cornerSmoothing={100}
                        preserveSmoothing
                        style={{
                            backgroundColor: colors.containerContent,
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            height: 40,
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <FlexText style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                            {title || t("notes.detail.fallbackTitle")}
                        </FlexText>
                    </SquircleView>
                </View>

                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 20,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    <TouchableOpacity onPress={() => router.push({ pathname: '/create-note', params: { id: note.id } })} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="pencil" size={20} color={colors.text} />
                    </TouchableOpacity>
                </SquircleView>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }}>
                {elements.length > 0 && (
                    <MediaViewer
                        items={imageUrls.map((url): MediaViewerItem => ({ type: 'image', source: url }))}
                        config={{ theme: 'dark', thumbnail: { fit: 'cover' } }}
                        renderLayout={({ renderItem }) => (
                            <>
                                {elements.map((el, index) => {
                                    if (el.type === 'image') {
                                        return (
                                            <View key={index} style={{ marginBottom: 16 }}>
                                                {renderItem(el.imageIndex, {
                                                    frame: { width: '100%' as any, aspectRatio: 1 / 1, borderRadius: 16 },
                                                })}
                                            </View>
                                        );
                                    }
                                    if (el.type === 'link') {
                                        return (
                                            <View key={index} style={{ marginBottom: 16 }}>
                                                <LinkPreview
                                                    text={el.url}
                                                    renderText={() => <FlexText style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>{t("notes.common.linkPreviewHint")}</FlexText>}
                                                    renderTitle={(title) => <FlexText style={{ color: colors.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={2}>{title}</FlexText>}
                                                    renderDescription={(desc) => <FlexText style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={3}>{desc}</FlexText>}
                                                    containerStyle={{ borderRadius: 12, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}
                                                />
                                            </View>
                                        );
                                    }
                                    if (el.type === 'text') {
                                        return (
                                            <FlexText key={index} style={[common.body, { fontSize: 18, lineHeight: 28, color: colors.text, marginBottom: 16 }]}>
                                                {el.text}
                                            </FlexText>
                                        );
                                    }
                                    return null;
                                })}
                            </>
                        )}
                    />
                )}
            </ScrollView>
        </View>
    );
};

export default NoteDetailScreen;
