import VerifiedIcon from "@/icons/verified";
import { Galeria } from "@nandorojo/galeria";
import { Image } from "expo-image";
import { Avatar } from "heroui-native/avatar";
import { Spinner } from "heroui-native/spinner";
import React, { memo, useState, useEffect } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { Comment } from "../../types/comment";
import { EMOJI_ASSETS } from "../../utils/emojiResolver";
import { parseCommentContent } from "../../viewmodels/CommentsSheetViewModel";
import { FlexText } from "../FlexText";
import { useTranslation } from "react-i18next";
import { guessLanguageAsync } from "@bsky.app/expo-guess-language";
import { useLanguageStore } from "../../stores/language";
import { useTranslationStore } from "../../stores/translation";

export interface CommentItemProps {
    comment: Comment;
    colors: any;
    common: any;
    theme: any;
    isOwn: boolean;
    onPress: () => void;
    onDelete: () => void;
    onEdit: () => void;
    formatTimeAgo: (dateString: string) => string;
    editLabel: string;
    deleteLabel: string;
    replyLabel?: string;
    isDeleting?: boolean;
    isReply?: boolean;
    onReply?: () => void;
}

export const CommentItem = memo(({ 
    comment, 
    colors, 
    common, 
    theme, 
    isOwn, 
    onPress, 
    onDelete, 
    onEdit, 
    formatTimeAgo, 
    editLabel, 
    deleteLabel, 
    replyLabel,
    isDeleting,
    isReply = false,
    onReply
}: CommentItemProps) => {
    const { text, imageUrl } = parseCommentContent(comment.content);
    const { t } = useTranslation();
    const { translationLanguage } = useLanguageStore();
    const { translations, translate, clearTranslation } = useTranslationStore();
    const translation = translations[comment.id];
    const [needsTranslation, setNeedsTranslation] = useState(false);

    useEffect(() => {
        if (!text) return;
        // Ignore mentions/tags and check if there's any actual text to translate
        const cleanText = text.replace(/@\w+/g, '').trim();
        if (!cleanText) {
            setNeedsTranslation(false);
            return;
        }

        guessLanguageAsync(text).then((guessed: any) => {
            const detected = guessed?.[0]?.language;
            if (detected && detected.split('-')[0] !== translationLanguage.split('-')[0]) {
                setNeedsTranslation(true);
            } else {
                setNeedsTranslation(false);
            }
        }).catch(() => { });
    }, [text, translationLanguage]);

    const handleTranslationPress = () => {
        if (translation?.translatedText || translation?.translationError) {
            clearTranslation(comment.id);
        } else {
            translate(comment.id, text, translationLanguage);
        }
    };

    const displayedText = (translation?.translatedText && !translation.isTranslating) 
        ? translation.translatedText 
        : text;

    let translateLabel: string = t('post.translate', 'Translate');
    if (translation?.isTranslating) {
        translateLabel = t('post.translating', 'Translating...');
    } else if (translation?.translatedText) {
        translateLabel = t('post.showOriginal', 'Show Original');
    }

    return (
        <View style={[styles.commentItem, isReply && styles.replyCommentItem]}>
            {/* Avatar */}
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.avatarContainer}>
                <Avatar style={[styles.avatar, isReply && styles.replyAvatar]}>
                    <Avatar.Image source={{ uri: comment.profile_avatar }} />
                    <Avatar.Fallback>{comment.profile_name?.[0] || 'U'}</Avatar.Fallback>
                </Avatar>
            </TouchableOpacity>

            {/* Content Bubble */}
            <View style={styles.contentWrapper}>
                <View>
                    <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }]} numberOfLines={1}>
                                {comment.profile_name}
                            </FlexText>
                            {comment.profile_is_verified && <VerifiedIcon size={12} />}
                        </TouchableOpacity>
                    </View>

                    {/* Text content (with image tags stripped) */}
                    {text.length > 0 && (
                        <View>
                            <FlexText
                                style={[common.body, { fontSize: 14, marginTop: 2, lineHeight: 20 }]}
                                parse={[
                                    {
                                        pattern: /@\w+/g,
                                        style: { color: colors.primary, fontWeight: '600' }
                                    }
                                ]}
                            >
                                {displayedText}
                            </FlexText>
                            {translation?.translationError && (
                                <FlexText style={{ color: colors.error || '#ff0000', fontSize: 12, marginTop: 4 }}>
                                    {translation.translationError}
                                </FlexText>
                            )}
                        </View>
                    )}

                    {imageUrl && (
                        <View style={{ marginTop: 8, position: 'relative' }}>
                            {EMOJI_ASSETS[imageUrl] ? (
                                <Image
                                    source={EMOJI_ASSETS[imageUrl]}
                                    style={{ width: 120, height: 120 }}
                                    contentFit="contain"
                                />
                            ) : (
                                <Galeria urls={[imageUrl]} theme={theme}>
                                    <Galeria.Image>
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={[styles.commentImage, { width: '100%' }]}
                                            contentFit="cover"
                                        />
                                    </Galeria.Image>
                                </Galeria>
                            )}
                        </View>
                    )}
                </View>

                <View style={[common.row, { alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }]}>
                    <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, fontSize: 12 }]}>
                        {formatTimeAgo(comment.created_at)}
                    </FlexText>

                    {onReply && (
                        <>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onReply}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                                    {replyLabel}
                                </FlexText>
                            </TouchableOpacity>
                        </>
                    )}

                    {(needsTranslation || !!translation) && (
                        <>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={handleTranslationPress}
                                disabled={translation?.isTranslating}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <FlexText style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                    {translateLabel}
                                </FlexText>
                            </TouchableOpacity>
                        </>
                    )}

                    {isOwn && (
                        <>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onEdit}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                                    {editLabel}
                                </FlexText>
                            </TouchableOpacity>
                            <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, marginHorizontal: 8 }}>•</FlexText>
                            <TouchableOpacity
                                onPress={onDelete}
                                disabled={isDeleting}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={[styles.actionButton, { minWidth: 32, alignItems: 'center' }]}
                            >
                                {isDeleting ? (
                                    <Spinner size="md" color={colors.onSurfaceVariant} style={{ transform: [{ scale: 0.8 }] }} />
                                ) : (
                                    <FlexText style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                                        {deleteLabel}
                                    </FlexText>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
});

CommentItem.displayName = "CommentItem";

const styles = StyleSheet.create({
    commentItem: {
        flexDirection: "row",
        marginBottom: 20,
        gap: 12,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    contentWrapper: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    commentImage: {
        height: 240,
        borderRadius: 12,
    },
    actionButton: {
    },
    replyCommentItem: {
        marginBottom: 12,
    },
    replyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
});
