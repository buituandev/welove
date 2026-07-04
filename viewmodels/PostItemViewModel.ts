import { Post } from "@/types/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clipboard } from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleBookmark } from "../services/bookmark";
import { useToggleLike } from "../services/like";
import { useCreatePost, useSharePost } from "../services/post";
import { useProfile } from "../services/userprofile";
import { useAudioStore } from "../stores/audio";
import { createCommonStyles } from "../styles/common";

interface UsePostItemViewModelProps {
    post: Post;
    onOptionsPress?: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
}

export const usePostItemViewModel = ({
    post,
    onOptionsPress,
    onLikeCountPress,
    onCommentPress,
}: UsePostItemViewModelProps) => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const currentProfileId = Array.isArray(params.id) ? params.id[0] : params.id;
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);

    // ─── Post ID Tracking for Cell Recycling ────────────────────
    const [prevPostId, setPrevPostId] = useState(post.id);

    // ─── Like State (optimistic) ────────────────────────────────
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const toggleLikeMutation = useToggleLike();

    const handleLikePress = useCallback(() => {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prev: number) => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

        toggleLikeMutation.mutate(
            { postId: post.id, isLiked },
            {
                onError: () => {
                    setIsLiked(isLiked);
                    setLikeCount(post.like_count);
                },
            }
        );
    }, [isLiked, post.id, post.like_count, toggleLikeMutation]);

    const handleLikeCountPress = useCallback(() => {
        onLikeCountPress?.(post);
    }, [onLikeCountPress, post]);

    const handleCommentPress = useCallback(() => {
        onCommentPress?.(post);
    }, [onCommentPress, post]);

    // ─── Profile Navigation ─────────────────────────────────────
    const handleProfilePress = useCallback(() => {
        if (currentProfileId && String(currentProfileId) === String(post.profile_id)) return;
        router.push({
            pathname: '/profile/[id]',
            params: { id: post.profile_id },
        });
    }, [currentProfileId, post.profile_id, router]);

    // ─── Music ──────────────────────────────────────────────────
    const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore();
    const isPlaying = currentlyPlayingId === post.id;

    const toggleMusic = useCallback(() => {
        if (!post.music?.preview_url) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(post.id, post.music.preview_url, {
                title: post.music.title,
                artist: post.music.artist,
                coverUrl: post.music.cover_url,
            });
        }
    }, [isPlaying, post.id, post.music, playTrack, stopPlayback]);

    // ─── Options ────────────────────────────────────────────────
    const handleOptionsPress = useCallback(() => {
        onOptionsPress?.(post);
    }, [onOptionsPress, post]);

    // ─── Bookmark State (optimistic) ────────────────────────────
    const [isBookmarked, setIsBookmarked] = useState(!!post.is_bookmarked);
    const toggleBookmarkMutation = useToggleBookmark();

    if (post.id !== prevPostId) {
        setPrevPostId(post.id);
        setIsLiked(post.is_liked);
        setLikeCount(post.like_count);
        setIsBookmarked(!!post.is_bookmarked);
    }

    const handleBookmarkPress = useCallback(() => {
        const prev = isBookmarked;
        setIsBookmarked(!prev);
        toggleBookmarkMutation.mutate(
            { postId: post.id, isBookmarked: prev },
            {
                onError: () => {
                    setIsBookmarked(prev);
                },
            }
        );
    }, [isBookmarked, post.id, toggleBookmarkMutation]);

    // ─── Share / Repost ─────────────────────────────────────────
    const { t } = useTranslation();
    const { toast } = useToast();
    const { data: myProfile } = useProfile('me', true);

    const sharePostMutation = useSharePost();
    const createPostMutation = useCreatePost(myProfile?.id || "");

    interface DialogButton {
        text: string;
        onPress: () => void;
        variant?: "primary" | "secondary" | "tertiary" | "danger" | "danger-soft" | "ghost" | "outline";
    }

    interface DialogConfig {
        title: string;
        text: string;
        confirmText?: string;
        dismissText?: string;
        onConfirm?: () => void;
        isDestructive?: boolean;
        buttons?: DialogButton[];
    }

    const [dialog, setDialog] = useState<DialogConfig | null>(null);
    const closeDialog = useCallback(() => setDialog(null), []);

    const handleCopyLink = useCallback(() => {
        const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || "https://welove.com";
        Clipboard.setString(`${serverUrl}/posts/${post.id}`);
        toast.show({
            label: t('post.dialogs.copyLinkTitle'),
            description: t('post.dialogs.linkCopied'),
            variant: "success"
        });
    }, [post.id, t, toast]);

    const handleDirectRepost = useCallback(async () => {
        if (!myProfile?.id) {
            toast.show({
                label: t('post.dialogs.errorTitle'),
                description: t('create.dialog.profileNotLoaded'),
                variant: "danger"
            });
            return;
        }

        try {
            // Build direct repost content
            const repostContent = `<post id="${post.id}" />`;

            await createPostMutation.mutateAsync({
                content: repostContent,
                device: "Mobile Repost",
            });

            // Increment original post's share count on backend
            sharePostMutation.mutate(post.id);

            toast.show({
                label: t('post.dialogs.shareTitle'),
                description: t('post.dialogs.repostSuccess'),
                variant: "success"
            });
        } catch (error: any) {
            console.error("Repost failed", error);
            toast.show({
                label: t('post.dialogs.errorTitle'),
                description: error.message || t('post.dialogs.repostFailed'),
                variant: "danger"
            });
        }
    }, [myProfile?.id, post.id, createPostMutation, sharePostMutation, t, toast]);

    const handleQuoteRepost = useCallback(() => {
        const firstImageMedia = post.media?.find((m: any) => m.type === 'image' || m.type === 'photo' || m.type === 'video');
        router.push({
            pathname: '/create',
            params: {
                repost_author: post.profile_name,
                repost_content: post.content || '',
                repost_deezer_id: post.deezer_id || '',
                repost_links: JSON.stringify(post.links || []),
                repost_id: post.id,
                repost_media_url: firstImageMedia?.url || ''
            }
        });
    }, [post.id, post.profile_name, post.content, post.deezer_id, post.links, post.media, router]);

    const handleSharePress = useCallback(() => {
        setDialog({
            title: t('post.dialogs.shareTitle'),
            text: t('post.optionsSheet.subtitle'),
            buttons: [
                {
                    text: t('post.dialogs.repostInstant'),
                    onPress: () => {
                        closeDialog();
                        handleDirectRepost();
                    },
                    variant: "primary"
                },
                {
                    text: t('post.dialogs.repostQuote'),
                    onPress: () => {
                        closeDialog();
                        handleQuoteRepost();
                    },
                    variant: "outline"
                }
            ]
        });
    }, [t, handleDirectRepost, handleQuoteRepost, closeDialog]);

    // ─── Derived ────────────────────────────────────────────────
    const hasMedia = post.media && post.media.length > 0;
    const hasMusic = !!post.music?.preview_url;

    return {
        // Theme
        colors,
        common,

        // Like
        isLiked,
        likeCount,
        handleLikePress,
        handleLikeCountPress,
        handleCommentPress,

        // Profile
        handleProfilePress,

        // Music
        isPlaying,
        toggleMusic,

        // Options
        handleOptionsPress,

        // Bookmark
        isBookmarked,
        handleBookmarkPress,

        // Share / Repost
        handleSharePress,
        handleCopyLink,
        dialog,
        closeDialog,

        // Derived
        hasMedia,
        hasMusic,

        // Post data
        post,
    };
};
