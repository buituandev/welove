import MusicIcon from "@/assets/images/svg/music-2.svg";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import BookmarkIcon from "@/icons/bookmark";
import BookmarkSolidIcon from "@/icons/bookmarksolid";
import CommentIcon from "@/icons/comment";
import LikeIcon from "@/icons/like";
import LikeSolidIcon from "@/icons/likedsolid";
import ShareIcon from "@/icons/share";
import VerifiedIcon from "@/icons/verified";
import { usePrecacheProfileFromPost } from "@/services/profileCache";
import { Link, Media, Post } from "@/types/post";
import { stripYouTubeUrls } from "@/utils/youtube";
import { guessLanguageAsync } from "@bsky.app/expo-guess-language";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Avatar } from "heroui-native/avatar";
import { Button } from "heroui-native/button";
import { Dialog } from "heroui-native/dialog";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Spinner } from "heroui-native/spinner";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { LANGUAGE_LABELS, SupportedLanguage } from "../i18n";
import { useLanguageStore } from "../stores/language";
import { useTranslationStore } from "../stores/translation";
import { usePostItemViewModel } from "../viewmodels/PostItemViewModel";
import CaptionText from "./CaptionText";
import { FlexText } from "./FlexText";
import { PostAudioWaveform } from "./PostAudioWaveform";
import { LINK_CARD_WIDTH, PostLinkPreview } from "./PostLinkPreview";
import { PostMediaCarousel } from "./PostMediaCarousel";
import { PostMetaInfo } from "./PostMetaInfo";
import { YouTubePostPlayer } from "./YouTubePostPlayer";

export interface PostItemProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
    isBookmarked?: boolean;
}

export const PostItem = React.memo(({ post, onOptionsPress, onLikeCountPress, onCommentPress, isBookmarked = false }: PostItemProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const { t } = useTranslation();
    const { translationLanguage } = useLanguageStore();
    const { translations, translate, clearTranslation, setActivePost } = useTranslationStore();
    const translation = translations[post.id];
    const [needsTranslation, setNeedsTranslation] = useState(false);

    useEffect(() => {
        if (!post.content) return;
        guessLanguageAsync(post.content).then((guessed: any) => {
            const detected = guessed?.[0]?.language;
            if (detected && detected.split('-')[0] !== translationLanguage.split('-')[0]) {
                setNeedsTranslation(true);
            } else {
                setNeedsTranslation(false);
            }
        }).catch(() => { });
    }, [post.content, translationLanguage]);

    const isRepost = !!post.reposted_post;
    const originalPost = post.reposted_post;
    const isRepostDeleted = isRepost && originalPost.deleted;

    // Merge original post's assets (media, music, links, audio, device) into a displayPost object
    const displayPost = React.useMemo(() => {
        if (isRepost && !isRepostDeleted) {
            return {
                ...post,
                media: originalPost.media,
                music: originalPost.music,
                links: originalPost.links,
                audio_url: originalPost.audio_url,
                device: originalPost.device,
            };
        }
        return post;
    }, [post, isRepost, isRepostDeleted, originalPost]);

    const vm = usePostItemViewModel({ post: displayPost, onOptionsPress, onLikeCountPress, onCommentPress });

    // Feed video state - optimally select ONLY boolean to prevent mass re-renders
    const hasVideo = displayPost.media?.some((m: Media) => m.type === 'video');

    // Caption without any YouTube URLs — those are rendered by YouTubePostPlayer.
    const captionWithoutYouTube = React.useMemo(
        () => (post.content ? stripYouTubeUrls(post.content) : ''),
        [post.content]
    );



    const originalAvatarPlaceholder = React.useMemo(
        () => resolveBlurhash(undefined, originalPost?.profile_id),
        [originalPost?.profile_id]
    );

    // ─── Pre-cache author profile for instant navigation ──────────────────────
    // Mirrors Bluesky's precacheProfile call. Runs after paint (useEffect) so
    // it never blocks render. Writes a partial Profile stub into TanStack Query's
    // cache — when the user taps this post's author, the profile screen renders
    // its header immediately using this cached data (0ms wait).
    const precacheProfile = usePrecacheProfileFromPost();
    useEffect(() => {
        precacheProfile(post);
        // Also cache the original author for reposts
        if (post.reposted_post && !post.reposted_post.deleted) {
            precacheProfile(post.reposted_post);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.profile_id]);

    return (
        <View style={{}}>
            {/* Header */}
            <View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
                <PressableFeedback>
                    <PressableFeedback.Highlight />
                    <PressableFeedback.Ripple />
                    <Pressable onPress={vm.handleProfilePress} style={[vm.common.row, { gap: 12, flex: 1 }]}>
                        <Avatar style={{ width: 40, height: 40 }}>
                            <Avatar.Image
                                source={{ uri: post.profile_avatar }}
                            />
                            <Avatar.Fallback>
                                {post.profile_name?.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                        </Avatar>
                        <View>
                            <View style={[vm.common.row, { gap: 4 }]}>
                                <FlexText style={[vm.common.heading, { fontSize: 16 }]}>{post.profile_name}</FlexText>
                                {post.profile_is_verified && <VerifiedIcon size={16} />}
                            </View>
                            <PostMetaInfo post={post} />
                        </View>
                    </Pressable>
                </PressableFeedback>
                {!isBookmarked && (
                    <TouchableOpacity
                        hitSlop={10}
                        style={{ backgroundColor: vm.colors.surfaceContainerHigh, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}
                        onPress={vm.handleOptionsPress}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={vm.colors.onSurface} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Captions Block (Supports standard caption and embedded quote repost layout) */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                {isRepost ? (
                    isRepostDeleted ? (
                        <View style={{ gap: 8 }}>
                            {!!captionWithoutYouTube && <CaptionText caption={captionWithoutYouTube} colors={vm.colors} common={vm.common} />}
                            <View style={[vm.common.row, {
                                borderLeftWidth: 3,
                                borderLeftColor: vm.colors.error,
                                paddingLeft: 12,
                                paddingVertical: 4,
                                gap: 8,
                                alignItems: 'center'
                            }]}>
                                <Ionicons name="alert-circle-outline" size={16} color={vm.colors.onSurfaceVariant} />
                                <FlexText style={[vm.common.bodySmall, { color: vm.colors.onSurfaceVariant, fontStyle: 'italic' }]}>
                                    {originalPost.text || t('post.dialogs.repostFailed')}
                                </FlexText>
                            </View>
                        </View>
                    ) : (
                        <View style={{ gap: 8 }}>
                            {/* Reposter's quote caption (if it exists) */}
                            {!!captionWithoutYouTube && (
                                <CaptionText caption={captionWithoutYouTube} colors={vm.colors} common={vm.common} />
                            )}

                            {/* Quoted Original Post with author info right under it */}
                            <View style={{
                                borderLeftWidth: 3,
                                borderLeftColor: vm.colors.primary,
                                paddingLeft: 12,
                                paddingVertical: 2,
                            }}>
                                {!!originalPost.content && (
                                    <FlexText style={[vm.common.body, { fontStyle: 'italic', fontSize: 14, color: vm.colors.onSurface }]} numberOfLines={4}>
                                        {originalPost.content}
                                    </FlexText>
                                )}
                                <TouchableOpacity
                                    onPress={() => {
                                        router.push({
                                            pathname: '/profile/[id]',
                                            params: { id: originalPost.profile_id },
                                        });
                                    }}
                                    style={[vm.common.row, { gap: 6, alignItems: 'center', marginTop: 4 }]}
                                >
                                    <ExpoImage
                                        source={{ uri: originalPost.profile_avatar }}
                                        style={{ width: 18, height: 18, borderRadius: 9999 }}
                                        contentFit="cover"
                                        placeholder={{ blurhash: originalAvatarPlaceholder }}
                                    />
                                    <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }]}>
                                        Reposted from {originalPost.profile_name}
                                    </FlexText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                ) : (
                    captionWithoutYouTube ? (
                        <CaptionText caption={captionWithoutYouTube} colors={vm.colors} common={vm.common} />
                    ) : null
                )}

                {/* Translation Link / Translation Results */}
                {needsTranslation && !translation && (
                    <TouchableOpacity
                        onPress={() => translate(post.id, post.content, translationLanguage)}
                        style={{ marginTop: 4, alignSelf: 'flex-start' }}
                    >
                        <FlexText style={[vm.common.bodySmall, { color: vm.colors.primary, fontWeight: '600' }]}>
                            {t('post.translate', 'Translate')}
                        </FlexText>
                    </TouchableOpacity>
                )}

                {translation && (
                    <View style={{ marginTop: 8 }}>
                        {translation.isTranslating && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                                <Spinner size="sm" color={vm.colors.primary} />
                                <FlexText style={[vm.common.bodySmall, { color: vm.colors.muted }]}>
                                    {t('post.translating', 'Translating...')}
                                </FlexText>
                            </View>
                        )}

                        {translation.translatedText && !translation.isTranslating && (
                            <SquircleView cornerSmoothing={100} preserveSmoothing style={{
                                padding: 12,
                                marginTop: 6,
                                borderWidth: 1,
                                borderColor: vm.colors.outlineVariant,
                                borderRadius: 16,
                                gap: 6,
                                position: 'relative',
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    paddingRight: 24, // Leave space for close button
                                }}>
                                    {translation.detectedLanguage ? (
                                        <>
                                            <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                                {LANGUAGE_LABELS[translation.detectedLanguage as SupportedLanguage] || translation.detectedLanguage.toUpperCase()}
                                            </FlexText>
                                            <Ionicons name="arrow-forward" size={10} color={vm.colors.onSurfaceVariant} style={{ marginHorizontal: 4 }} />
                                            <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                                {LANGUAGE_LABELS[translation.targetLanguage as SupportedLanguage] || translation.targetLanguage.toUpperCase()}
                                            </FlexText>
                                        </>
                                    ) : (
                                        <FlexText style={[vm.common.label, { color: vm.colors.onSurfaceVariant, fontSize: 11 }]}>
                                            {t('post.translated', 'Translated')}
                                        </FlexText>
                                    )}

                                    <FlexText style={{ color: vm.colors.onSurfaceVariant, fontSize: 11, marginHorizontal: 4 }}>
                                        &middot;
                                    </FlexText>

                                    <TouchableOpacity onPress={() => {
                                        setActivePost(post.id, post.content);
                                        TrueSheet.present('translation-language-sheet');
                                    }}>
                                        <FlexText style={[vm.common.label, { color: vm.colors.primary, fontSize: 11, fontWeight: '600' }]}>
                                            {t('post.changeLanguage', 'Change')}
                                        </FlexText>
                                    </TouchableOpacity>
                                </View>
                                <FlexText selectable style={[vm.common.body, { fontSize: 14, color: vm.colors.onSurface, marginTop: 2 }]}>
                                    {translation.translatedText}
                                </FlexText>
                                <TouchableOpacity
                                    onPress={() => clearTranslation(post.id)}
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        padding: 4,
                                    }}
                                >
                                    <Ionicons name="close" size={16} color={vm.colors.onSurfaceVariant} />
                                </TouchableOpacity>
                            </SquircleView>
                        )}

                        {translation.translationError && !translation.isTranslating && (
                            <View style={{
                                padding: 10,
                                backgroundColor: vm.colors.errorContainer,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <Ionicons name="alert-circle" size={16} color={vm.colors.onErrorContainer} />
                                <FlexText style={[vm.common.bodySmall, { color: vm.colors.onErrorContainer, flex: 1, fontSize: 12 }]}>
                                    {translation.translationError}
                                </FlexText>
                                <TouchableOpacity onPress={() => clearTranslation(post.id)}>
                                    <Ionicons name="close" size={14} color={vm.colors.onErrorContainer} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* YouTube links detected in the caption — single player or carousel */}
            {isRepost && !isRepostDeleted && originalPost.content ? (
                <YouTubePostPlayer postId={originalPost.id} caption={originalPost.content} />
            ) : (post.content ? (
                <YouTubePostPlayer postId={post.id} caption={post.content} />
            ) : null)}

            {/* Media & Audio Overlay */}
            <View>
                <PostMediaCarousel
                    media={displayPost.media}
                    postId={post.id}
                    profileName={displayPost.profile_name}
                    content={displayPost.content}
                    colors={vm.colors}
                    isAdult={displayPost.is_adult}
                    isVerified={displayPost.profile_is_verified}
                    musicUrl={displayPost.music?.preview_url}
                    musicTitle={displayPost.music ? `${displayPost.music.artist} - ${displayPost.music.title}` : undefined}
                />

                {/* Music icon */}
                {vm.hasMedia && vm.hasMusic && (
                    <Pressable
                        onPress={vm.toggleMusic}
                        style={{
                            position: 'absolute',
                            bottom: 24,
                            right: hasVideo ? 56 : 16,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 8,
                            borderRadius: 20,
                            zIndex: 20
                        }}
                    >
                        {vm.isPlaying ? (
                            <MusicIcon width={18} height={18} color="white" fill="white" />
                        ) : (
                            <MusicIcon width={18} height={18} color="white" fill="none" />
                        )}
                    </Pressable>
                )}
            </View>

            {/* Audio Waveform — shown when post has a direct audio_url */}
            {!!displayPost.audio_url && (
                <PostAudioWaveform
                    postId={post.id}
                    audioUrl={displayPost.audio_url}
                    colors={vm.colors}
                    label={displayPost.profile_name}
                />
            )}

            {/* Invisible Spacer for No-Media Posts */}
            {!vm.hasMedia && (
                <View style={{ width: screenWidth, height: 1 }} />
            )}

            {/* Audio Button for No-Media Posts */}
            {!vm.hasMedia && vm.hasMusic && (
                <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 }}>
                    <Pressable
                        onPress={vm.toggleMusic}
                        style={{
                            backgroundColor: vm.colors.surfaceContainerHigh,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: vm.colors.outlineVariant,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <Ionicons name={vm.isPlaying ? "volume-high" : "volume-mute"} size={16} color={vm.colors.onSurface} />
                        <FlexText style={[vm.common.label, { fontSize: 12 }]}>
                            {t('post.audioPreview')}
                        </FlexText>
                    </Pressable>
                </View>
            )}

            {/* Links — single link: full-width symmetric view; multiple: horizontal peek scroll */}
            {displayPost.links && displayPost.links.length > 0 && (
                displayPost.links.length === 1 ? (
                    // Single link — equal 16px padding both sides, card fills the gap
                    (<View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                        <PostLinkPreview
                            key={displayPost.links[0].url || 0}
                            url={displayPost.links[0].url}
                            label={displayPost.links[0].label}
                            colors={vm.colors}
                            cardWidth={screenWidth - 32}
                        />
                    </View>)
                ) : (
                    // Multiple links — peek-through horizontal scroll
                    (<ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToOffsets={displayPost.links.map((_: Link, i: number) => i * (LINK_CARD_WIDTH + 10))}
                        snapToAlignment="start"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 12,
                            gap: 10,
                        }}
                        style={{ marginBottom: 4 }}
                    >
                        {displayPost.links.map((item: Link, index: number) => (
                            <PostLinkPreview
                                key={item.url || index}
                                url={item.url}
                                label={item.label}
                                colors={vm.colors}
                            />
                        ))}
                    </ScrollView>)
                )
            )}

            {displayPost.device && (
                <FlexText
                    style={[
                        vm.common.label,
                        { color: vm.colors.onSurfaceVariant, fontSize: 13, marginBottom: 8, paddingHorizontal: 16 },
                    ]}
                >
                    {t('post.createdOnDevice', { device: displayPost.device })}
                </FlexText>
            )}

            {/* Action Bar */}
            {isBookmarked ? (
                // Bookmarks screen: read-only stats, no bookmark button
                (<View style={[vm.common.row, { justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 16, gap: 20 }]}>
                    <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <PressableFeedback>
                            <PressableFeedback.Ripple />
                            <Pressable hitSlop={10} onPress={vm.handleLikePress}>
                                {vm.isLiked ? (
                                    <LikeSolidIcon size={24} color={vm.colors.onSurface} />
                                ) : (
                                    <LikeIcon size={24} color={vm.colors.onSurface} />
                                )}
                            </Pressable>
                        </PressableFeedback>
                        <PressableFeedback>
                            <PressableFeedback.Ripple />
                            <Pressable hitSlop={10} onPress={vm.handleLikeCountPress}>
                                <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '800' }]}>{vm.likeCount}</FlexText>
                            </Pressable>
                        </PressableFeedback>
                    </View>
                    <Pressable hitSlop={10} onPress={vm.handleCommentPress} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                        <CommentIcon size={24} color={vm.colors.onSurface} />
                        <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '800' }]}>{post.comment_count}</FlexText>
                    </Pressable>
                    <Pressable hitSlop={10} onPress={vm.handleBookmarkPress}>
                        {vm.isBookmarked ? (
                            <BookmarkSolidIcon size={24} color={vm.colors.onSurface} />
                        ) : (
                            <BookmarkIcon size={24} color={vm.colors.onSurface} />
                        )}
                    </Pressable>
                </View>)
            ) : (
                // Feed: full interactive action bar with bookmark toggle
                (<View style={[vm.common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
                    <View style={[vm.common.row, { gap: 20 }]}>
                        <View style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                            <PressableFeedback>
                                <PressableFeedback.Ripple />
                                <Pressable hitSlop={10} onPress={vm.handleLikePress}>
                                    {vm.isLiked ? (
                                        <LikeSolidIcon size={24} color={vm.colors.onSurface} />
                                    ) : (
                                        <LikeIcon size={24} color={vm.colors.onSurface} />
                                    )}
                                </Pressable>
                            </PressableFeedback>
                            <TouchableOpacity hitSlop={10} onPress={vm.handleLikeCountPress}>
                                <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '800' }]}>{vm.likeCount}</FlexText>
                            </TouchableOpacity>
                        </View>
                        <PressableFeedback>
                            <PressableFeedback.Ripple />
                            <Pressable hitSlop={10} onPress={vm.handleCommentPress} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                                <CommentIcon size={24} color={vm.colors.onSurface} />
                                <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '800' }]}>{post.comment_count}</FlexText>
                            </Pressable>
                        </PressableFeedback>
                        {!isRepost && (
                            <PressableFeedback>
                                <PressableFeedback.Ripple />
                                <Pressable hitSlop={10} onPress={vm.handleSharePress} style={[vm.common.row, { gap: 6, alignItems: 'center' }]}>
                                    <ShareIcon size={24} color={vm.colors.onSurface} />
                                    <FlexText style={[vm.common.label, { color: vm.colors.onSurface, fontWeight: '800' }]}>{post.share_count}</FlexText>
                                </Pressable>
                            </PressableFeedback>
                        )}
                    </View>
                    <PressableFeedback>
                        <PressableFeedback.Ripple />
                        <Pressable hitSlop={10} onPress={vm.handleBookmarkPress}>
                            {vm.isBookmarked ? (
                                <BookmarkSolidIcon size={24} color={vm.colors.onSurface} />
                            ) : (
                                <BookmarkIcon size={24} color={vm.colors.onSurface} />
                            )}
                        </Pressable>
                    </PressableFeedback>
                </View>)
            )}

            <Dialog isOpen={vm.dialog !== null} onOpenChange={(open) => !open && vm.closeDialog()}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 20, gap: 6 }}>
                            <Dialog.Title>{vm.dialog?.title}</Dialog.Title>
                            <Dialog.Description>{vm.dialog?.text}</Dialog.Description>
                        </View>
                        {vm.dialog?.buttons ? (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {vm.dialog.buttons.map((btn, idx) => (
                                    <Button
                                        key={idx}
                                        variant={btn.variant ?? "primary"}
                                        onPress={btn.onPress}
                                        style={{ flex: 1 }}
                                    >
                                        {btn.text}
                                    </Button>
                                ))}
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                {vm.dialog?.dismissText && (
                                    <Button variant="ghost" onPress={vm.closeDialog}>
                                        {vm.dialog.dismissText}
                                    </Button>
                                )}
                                <Button
                                    variant={vm.dialog?.isDestructive || vm.dialog?.onConfirm ? "danger" : "primary"}
                                    onPress={() => vm.dialog?.onConfirm ? vm.dialog.onConfirm() : vm.closeDialog()}
                                >
                                    {vm.dialog?.confirmText ?? t('post.dialogs.ok')}
                                </Button>
                            </View>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        </View>
    );
}, (prev, next) => {
    return (
        prev.post.id === next.post.id &&
        prev.post.is_liked === next.post.is_liked &&
        prev.post.like_count === next.post.like_count &&
        prev.post.comment_count === next.post.comment_count &&
        prev.post.share_count === next.post.share_count &&
        prev.post.is_bookmarked === next.post.is_bookmarked &&
        prev.isBookmarked === next.isBookmarked &&
        JSON.stringify(prev.post.reposted_post) === JSON.stringify(next.post.reposted_post)
    );
});
PostItem.displayName = "PostItem";
