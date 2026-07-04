import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { GiphyDialog, GiphyRating } from "@giphy/react-native-sdk";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Keyboard,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlexText } from "../../components/FlexText";
import { useThemeContext } from "../../context/ThemeContext";
import { useCreateNote, useNote, useUpdateNote } from "../../services/note";
import { createCommonStyles } from "../../styles/common";

type Block =
    | { id: string; type: 'text'; text: string }
    | { id: string; type: 'image'; url: string }
    | { id: string; type: 'link'; url: string };

const CreateNoteScreen = () => {
    const { colors, typography, theme } = useThemeContext();
    const { t } = useTranslation();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const { toast } = useToast();

    const { id } = useLocalSearchParams();
    const noteId = id ? Number(id) : null;
    const isEditMode = noteId !== null;

    const { data: noteData, isLoading: isLoadingNote } = useNote(noteId || 0);
    const updateNoteMutation = useUpdateNote();
    const createNoteMutation = useCreateNote();

    const [title, setTitle] = useState(() => {
        if (isEditMode && noteData?.data) {
            const content = noteData.data.content;
            const titleMatch = content.match(/\[<title>(.*?)<\/title>\]/i);
            return titleMatch ? titleMatch[1] : "";
        }
        return "";
    });

    const [blocks, setBlocks] = useState<Block[]>(() => {
        if (isEditMode && noteData?.data) {
            const content = noteData.data.content;
            const strippedContent = content.replace(/\[<title>.*?<\/title>\]/gi, '');
            const parts = strippedContent.split(/(\[<img\s+.*?\s*\/>\]|\[<link\s+.*?\s*\/>\])/gi);

            const initialBlocks: Block[] = [];

            parts.forEach((part) => {
                if (!part) return;

                const imgMatch = part.match(/\[<img\s+(.*?)\s*\/>\]/i);
                if (imgMatch) {
                    initialBlocks.push({ id: Math.random().toString(), type: 'image', url: imgMatch[1] });
                    return;
                }

                const linkMatch = part.match(/\[<link\s+(.*?)\s*\/>\]/i);
                if (linkMatch) {
                    initialBlocks.push({ id: Math.random().toString(), type: 'link', url: linkMatch[1] });
                    return;
                }

                if (part) {
                    initialBlocks.push({ id: Math.random().toString(), type: 'text', text: part });
                }
            });

            if (initialBlocks.length === 0) {
                initialBlocks.push({ id: 'init', type: 'text', text: '' });
            }
            return initialBlocks;
        }
        return [{ id: 'init', type: 'text', text: '' }];
    });

    const [urlInput, setUrlInput] = useState("");
    const [inputType, setInputType] = useState<'image' | 'link' | null>(null);



    useEffect(() => {
        GiphyDialog.configure({
            theme: theme === 'dark' ? 'dark' : 'light',
            rating: GiphyRating.R,
        });

        const listener = GiphyDialog.addListener('onMediaSelect', (e) => {
            const media = e.media;
            const images = media?.data?.images || (media as any)?.images;

            if (images && images.original && images.original.url) {
                const imageUrl = images.original.url;
                setBlocks(prev => [
                    ...prev,
                    { id: Math.random().toString(), type: 'image', url: imageUrl },
                    { id: Math.random().toString(), type: 'text', text: '' } // add new empty text block after media
                ]);
            }
            GiphyDialog.hide();
        });
        return () => listener.remove();
    }, [theme]);

    const handleAddUrl = useCallback(() => {
        const urlStr = urlInput.trim();
        if (urlStr) {
            // Ensure the URL has a valid domain (e.g., containing a dot like .com) or is localhost
            const urlRegex = /^(https?:\/\/)?(localhost|[\w\-]+(\.[\w\-]+)+)(:\d+)?(\/.*)?$/i;
            if (!urlRegex.test(urlStr)) {
                toast.show({
                    variant: 'danger',
                    label: t("notes.editor.invalidUrlTitle"),
                    description: t("notes.editor.invalidUrlMessage"),
                });
                return;
            }

            let formattedUrl = urlStr;
            // Prepend https:// if no protocol is found to ensure valid URL object
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }

            try {
                new URL(formattedUrl);
            } catch {
                toast.show({
                    variant: 'danger',
                    label: t("notes.editor.invalidUrlTitle"),
                    description: t("notes.editor.invalidUrlMalformedMessage"),
                });
                return;
            }

            if (!inputType) return;

            const newBlock: Block = { id: Math.random().toString(), type: inputType, url: formattedUrl };
            setBlocks(prev => [
                ...prev,
                newBlock,
                { id: Math.random().toString(), type: 'text', text: '' } // auto add text block after
            ]);

            setUrlInput("");
            setInputType(null);
        }
    }, [urlInput, inputType, t, toast]);

    const handleSave = useCallback(() => {
        const fullContent = [
            title.trim() ? `[<title>${title.trim()}</title>]` : '',
            ...blocks.map(b => {
                if (b.type === 'text') return b.text;
                if (b.type === 'image') return `[<img ${b.url} />]`;
                if (b.type === 'link') return `[<link ${b.url} />]`;
                return '';
            })
        ].filter(Boolean).join('\n');

        if (!fullContent) return;

        if (isEditMode && noteId) {
            if (updateNoteMutation.isPending) return;
            updateNoteMutation.mutate(
                { id: noteId, data: { content: fullContent } },
                {
                    onSuccess: () => {
                        Keyboard.dismiss();
                        router.back();
                    }
                }
            );
        } else {
            if (createNoteMutation.isPending) return;
            createNoteMutation.mutate(
                { content: fullContent },
                {
                    onSuccess: () => {
                        Keyboard.dismiss();
                        router.back();
                    }
                }
            );
        }
    }, [title, blocks, createNoteMutation, updateNoteMutation, isEditMode, noteId]);

    const isSubmitting = createNoteMutation.isPending || updateNoteMutation.isPending;

    // Check if there is any meaningful content
    const hasContent = blocks.some(b => (b.type === 'text' && b.text.trim().length > 0) || b.type !== 'text');
    const canSubmit = (title.trim().length > 0 || hasContent) && !isSubmitting && !isLoadingNote;

    const handleClearAll = useCallback(() => {
        setTitle("");
        setBlocks([{ id: 'init', type: 'text', text: '' }]);
    }, []);

    if (isEditMode && isLoadingNote) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Spinner size="lg" color={colors.secondary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={common.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header (Floating) */}
            <SquircleView
                cornerSmoothing={100}
                preserveSmoothing
                style={{
                    position: 'absolute',
                    top: Math.max(insets.top, 16),
                    left: 16,
                    right: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 24,
                    padding: 12,
                    zIndex: 100
                }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="close" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <SquircleView
                    cornerSmoothing={100}
                    preserveSmoothing
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                    }}>
                    <FlexText style={[common.heading, { fontSize: 20, color: colors.onSurface }]}>{isEditMode ? t("notes.editor.titleEdit") : t("notes.editor.titleNew")}</FlexText>
                </SquircleView>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!canSubmit}
                    style={{
                        backgroundColor: canSubmit ? colors.onPrimary : colors.onSurfaceVariant,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                    }}
                >
                    {isSubmitting ? (
                        <Spinner size="sm" color={colors.onPrimary} />
                    ) : (
                        <FlexText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>{t("notes.editor.save")}</FlexText>
                    )}
                </TouchableOpacity>
            </SquircleView>

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: Math.max(insets.top, 16) + 80, paddingBottom: 160 }}
                bottomOffset={140}
            >
                <TextInput
                    style={{
                        color: colors.text,
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginBottom: 16,
                    }}
                    placeholder={t("notes.editor.noteTitlePlaceholder")}
                    placeholderTextColor={colors.muted}
                    value={title}
                    onChangeText={setTitle}
                />

                {blocks.map((block, index) => {
                    if (block.type === 'text') {
                        return (
                            <TextInput
                                key={block.id}
                                style={{
                                    color: colors.text,
                                    fontSize: 18,
                                    textAlignVertical: 'top',
                                    minHeight: blocks.length === 1 ? 120 : undefined,
                                }}
                                placeholder={index === 0 ? t("notes.editor.contentPlaceholder") : undefined}
                                placeholderTextColor={colors.muted}
                                multiline
                                value={block.text}
                                onChangeText={(val) => {
                                    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, text: val } : b));
                                }}
                            />
                        );
                    }

                    if (block.type === 'image') {
                        return (
                            <View key={block.id} style={{ marginTop: 12, marginBottom: 12, position: 'relative' }}>
                                <Image source={{ uri: block.url }} style={{ width: '100%', height: 180, borderRadius: 12 }} contentFit="cover" />
                                <TouchableOpacity
                                    onPress={() => setBlocks(prev => prev.filter(b => b.id !== block.id))}
                                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 4 }}
                                >
                                    <Ionicons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    if (block.type === 'link') {
                        return (
                            <View key={block.id} style={{ marginTop: 12, marginBottom: 12, position: 'relative' }}>
                                <LinkPreview
                                    text={block.url}
                                    renderText={() => <FlexText style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>{t("notes.common.linkPreviewHint")}</FlexText>}
                                    renderTitle={(title) => <FlexText style={{ color: colors.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={2}>{title}</FlexText>}
                                    renderDescription={(desc) => <FlexText style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={3}>{desc}</FlexText>}
                                    containerStyle={{ borderRadius: 12, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}
                                />
                                <TouchableOpacity
                                    onPress={() => setBlocks(prev => prev.filter(b => b.id !== block.id))}
                                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 4, zIndex: 10 }}
                                >
                                    <Ionicons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        );
                    }
                    return null;
                })}
            </KeyboardAwareScrollView>

            {/* Bottom Action Bar (Floating) */}
            <View style={{ position: 'absolute', bottom: Math.max(insets.bottom, 16), left: 16, right: 16 }}>
                {inputType !== null ? (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                        <SquircleView
                            cornerSmoothing={100}
                            preserveSmoothing
                            style={{
                                backgroundColor: colors.containerContent,
                                borderRadius: 24,
                                paddingVertical: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 8,
                            }}>
                            <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12, marginHorizontal: 16 }}>
                                <MaterialIcons name="link" size={18} color={colors.muted} />
                                <TextInput
                                    style={{ flex: 1, fontSize: 14, marginLeft: 8, color: colors.text }}
                                    placeholder={inputType === 'image' ? t("notes.editor.imageUrlPlaceholder") : t("notes.editor.linkUrlPlaceholder")}
                                    placeholderTextColor={colors.muted}
                                    value={urlInput}
                                    onChangeText={setUrlInput}
                                    autoFocus
                                    autoCapitalize="none"
                                    keyboardType="url"
                                    onSubmitEditing={handleAddUrl}
                                />
                                {urlInput.trim().length > 0 && (
                                    <TouchableOpacity onPress={handleAddUrl} style={{ marginLeft: 8 }}>
                                        <MaterialIcons name="check-circle" size={24} color={colors.verify || colors.text} />
                                    </TouchableOpacity>
                                )}
                            </SquircleView>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingLeft: 16, paddingRight: 8 }}>
                                    <TouchableOpacity onPress={() => setInputType(inputType === 'image' ? null : 'image')}>
                                        <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                            <MaterialIcons name="image" size={20} color={colors.text} />
                                            <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.imageUrlAction")}</FlexText>
                                        </SquircleView>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setInputType(inputType === 'link' ? null : 'link')}>
                                        <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                            <MaterialIcons name="public" size={20} color={colors.text} />
                                            <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.linkAction")}</FlexText>
                                        </SquircleView>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => GiphyDialog.show()}>
                                        <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                            <MaterialIcons name="gif" size={20} color={colors.text} />
                                            <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.gifAction")}</FlexText>
                                        </SquircleView>
                                    </TouchableOpacity>
                                </ScrollView>

                                <View style={{ width: 1, height: 24, backgroundColor: colors.muted, opacity: 0.3, marginHorizontal: 8 }} />
                                <TouchableOpacity onPress={handleClearAll} style={{ padding: 8, paddingRight: 16 }}>
                                    <Ionicons name="trash-outline" size={22} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        </SquircleView>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <SquircleView
                            cornerSmoothing={100}
                            preserveSmoothing
                            style={{
                                flex: 1,
                                backgroundColor: colors.containerContent,
                                borderRadius: 24,
                                paddingVertical: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 8,
                            }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                                <TouchableOpacity onPress={() => setInputType(inputType === 'image' ? null : 'image')}>
                                    <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                        <MaterialIcons name="image" size={20} color={colors.text} />
                                        <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.imageUrlAction")}</FlexText>
                                    </SquircleView>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setInputType(inputType === 'link' ? null : 'link')}>
                                    <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                        <MaterialIcons name="public" size={20} color={colors.text} />
                                        <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.linkAction")}</FlexText>
                                    </SquircleView>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => GiphyDialog.show()}>
                                    <SquircleView cornerSmoothing={100} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 }}>
                                        <MaterialIcons name="gif" size={20} color={colors.text} />
                                        <FlexText style={{ color: colors.text, fontWeight: '600' }}>{t("notes.editor.gifAction")}</FlexText>
                                    </SquircleView>
                                </TouchableOpacity>
                            </ScrollView>
                        </SquircleView>

                        <SquircleView
                            cornerSmoothing={100}
                            preserveSmoothing
                            style={{
                                width: 56,
                                height: 56,
                                backgroundColor: colors.containerContent,
                                borderRadius: 28,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 8,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <TouchableOpacity onPress={handleClearAll} style={{ width: 56, height: 56, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="trash-outline" size={24} color="#ff4444" />
                            </TouchableOpacity>
                        </SquircleView>
                    </Animated.View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

export default CreateNoteScreen;
