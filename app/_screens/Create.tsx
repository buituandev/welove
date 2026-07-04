import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { FormikHelpers, useFormik } from "formik";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";

// Toast
import { LoadingToast, useLoadingState } from "@/components/custom heroui/loading-toast";
import { ProgressToast, useProgressState } from "@/components/custom heroui/progress-toast";
import { useToast } from "heroui-native/toast";

// Components
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Image } from "expo-image";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { Dialog } from "heroui-native/dialog";
import {
    ContentInput,
    CreateActionBar,
    CreateProfileHeader,
    CreateScreenHeader,
    createStyles,
    LinksSection,
    LocationInput,
    MediaSection,
    MusicSection,
    SelectedMedia,
} from "../../components/create";
import { ProfilePickerSheet } from "../../components/gallery/sheets/ProfilePickerSheet";

// Context & Services
import { useThemeContext } from "../../context/ThemeContext";
import { DeezerTrack, useDeezerSearch } from "../../services/deezer";
import { FileAsset, useUploadMultipleMedia } from "../../services/mediaUpload";
import { CreatePostInput, sharePost, useCreatePost, useUpdatePost } from "../../services/post";
import { useAdminCheck, useProfile } from "../../services/userprofile";
import { useScrollStore } from "../../stores/scroll";
import { createCommonStyles } from "../../styles/common";
import { Link } from "../../types/post";
import { Profile } from "../../types/profile";

// ============================================================================
// Form Types & Validation Schema
// ============================================================================

interface CreatePostFormValues {
    content: string;
    location: string;
    selectedMedia: SelectedMedia[];
    links: Link[];
    isGhost: boolean;
    isAdult: boolean;
    selectedTrack: DeezerTrack | null;
    useThirdPartyUpload: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

const CreateScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const trigger = useScrollStore((state) => state.triggers['chat']);

    const { toast } = useToast();
    const { setIsLoading } = useLoadingState();
    const { setProgress, resetProgress } = useProgressState();
    const LOADING_TOAST_ID = 'loading-toast';
    const PROGRESS_TOAST_ID = 'progress-toast';
    const params = useLocalSearchParams<{
        repost_author?: string;
        repost_content?: string;
        repost_deezer_id?: string;
        repost_links?: string;
        repost_id?: string;
        repost_media_url?: string;
        edit_post_id?: string;
        edit_content?: string;
        edit_location?: string;
        edit_deezer_id?: string;
        edit_links?: string;
        edit_is_ghost?: string;
        edit_is_adult?: string;
        edit_music?: string;
    }>();
    const [dialog, setDialog] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, title: "", message: "", onConfirm: undefined });

    // Profile data
    const { data: myProfile } = useProfile('me', true);
    const { data: adminData } = useAdminCheck();
    const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin ?? myProfile?.is_admin);

    // Admin: selected profile (null = post as myself)
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const pickerSheetRef = useRef<TrueSheet>(null);

    const activeProfile = selectedProfile ?? myProfile ?? null;
    const profile = activeProfile;
    const profileId = activeProfile?.id ?? '';

    // Mutations
    const createPostMutation = useCreatePost(profileId);
    const updatePostMutation = useUpdatePost(profileId);
    const uploadMediaMutation = useUploadMultipleMedia(profileId);

    // Parse initial music if any
    const initialTrack = React.useMemo(() => {
        if (params.edit_music) {
            try {
                const parsed = JSON.parse(params.edit_music);
                return {
                    deezer_id: parsed.deezer_id,
                    title: parsed.title,
                    artist: parsed.artist,
                    cover_url: parsed.cover_url || parsed.cover || parsed.cover_medium || "",
                    album: parsed.album || "",
                    url: parsed.url || "",
                    duration: parsed.duration || 0,
                    preview: parsed.preview_url || parsed.preview || "",
                } as DeezerTrack;
            } catch (e) {
                console.error("Failed to parse edit music", e);
            }
        }
        return null;
    }, [params.edit_music]);

    const createPostValidationSchema = React.useMemo(() => Yup.object().shape({
        content: Yup.string().max(2000, "create.validation.contentTooLong"),
        location: Yup.string().max(200, "create.validation.locationTooLong"),
        selectedMedia: Yup.array(),
        links: Yup.array().of(
            Yup.object().shape({
                label: Yup.string().when('url', {
                    is: (url: string) => url && url.trim().length > 0,
                    then: (schema) => schema.required("create.validation.linkLabelRequired"),
                    otherwise: (schema) => schema,
                }),
                url: Yup.string().when('label', {
                    is: (label: string) => label && label.trim().length > 0,
                    then: (schema) => schema.required("create.validation.urlRequired").url("create.validation.urlInvalid"),
                    otherwise: (schema) => schema,
                }),
            }, [['label', 'url']])
        ),
        isGhost: Yup.boolean(),
        isAdult: Yup.boolean(),
        selectedTrack: Yup.object().nullable(),
    }).test(
        'content-or-media-required',
        'create.validation.contentOrMediaRequired',
        function (values) {
            const { content, selectedMedia } = values;
            if (params.edit_post_id) return true;
            return (content && content.trim().length > 0) || (selectedMedia && selectedMedia.length > 0);
        }
    ), [params.edit_post_id]);


    // Music State (search query is UI state, not form value)
    const [musicSearchQuery, setMusicSearchQuery] = useState("");
    const [showMusicSearch, setShowMusicSearch] = useState(false);
    const { data: musicResults, isLoading: isMusicLoading } = useDeezerSearch(musicSearchQuery, 10);

    // UI State
    const [showLinkInput, setShowLinkInput] = useState(!!params.edit_links && JSON.parse(params.edit_links).length > 0);
    const [showLocationInput, setShowLocationInput] = useState(!!params.edit_location);
    const [showActionBar, setShowActionBar] = useState(true);

    // Scroll tracking
    const scrollContentHeight = useRef(0);
    const scrollViewHeight = useRef(0);

    // ============================================================================
    // Formik Setup
    // ============================================================================

    const formik = useFormik<CreatePostFormValues>({
        enableReinitialize: true,
        initialValues: {
            content: params.edit_content || "",
            location: params.edit_location || "",
            selectedMedia: [],
            links: params.edit_links ? JSON.parse(params.edit_links) : [],
            isGhost: params.edit_is_ghost === "true",
            isAdult: params.edit_is_adult === "true",
            selectedTrack: initialTrack,
            useThirdPartyUpload: false,
        },
        validationSchema: createPostValidationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values: CreatePostFormValues, { resetForm: formikResetForm }: FormikHelpers<CreatePostFormValues>) => {
            if (!profileId) {
                setDialog({
                    visible: true,
                    title: t("create.dialog.errorTitle"),
                    message: t("create.dialog.profileNotLoaded"),
                });
                return;
            }

            const isEditing = !!params.edit_post_id;
            const hasMedia = values.selectedMedia.length > 0;
            const loadingText = isEditing
                ? t("create.toast.updating")
                : t("create.toast.creating");
            const successText = isEditing
                ? t("create.toast.updateSuccess")
                : t("create.toast.success");

            if (hasMedia && !isEditing) {
                resetProgress();
                toast.show({
                    id: PROGRESS_TOAST_ID,
                    duration: 'persistent',
                    component: (props) => <ProgressToast {...props} />,
                });
            } else {
                setIsLoading(true);
                toast.show({
                    id: LOADING_TOAST_ID,
                    duration: 'persistent',
                    component: (props) => (
                        <LoadingToast
                            {...props}
                            loadingText={loadingText}
                            successText={successText}
                        />
                    ),
                });
            }

            try {
                let mediaIds: string[] = [];

                // Upload media first if any (only when not editing)
                if (!params.edit_post_id && values.selectedMedia.length > 0) {
                    if (values.useThirdPartyUpload) {
                        const { uploadToThirdParty } = await import("../../services/thirdPartyUpload");
                        const { createMediaRecord } = await import("../../services/mediaUpload");

                        mediaIds = [];
                        for (let index = 0; index < values.selectedMedia.length; index++) {
                            const media = values.selectedMedia[index];
                            const files: FileAsset = {
                                uri: media.uri,
                                name: media.name,
                                type: media.type,
                                fileSize: media.fileSize,
                                width: media.width,
                                height: media.height,
                            };

                            const uploadResult = await uploadToThirdParty(files, ({ bytesSent, totalBytes }) => {
                                const fileProgress = (bytesSent / totalBytes) * 100;
                                const overallProgress = ((index * 100) + fileProgress) / values.selectedMedia.length;
                                setProgress(overallProgress);
                            });
                            const mediaType = media.isVideo ? 'video' : 'photo';
                            const createdRecord = await createMediaRecord(profileId, uploadResult.url, mediaType, {
                                thumbnail_url: uploadResult.thumbnailUrl,
                                width: uploadResult.width,
                                height: uploadResult.height,
                            });
                            mediaIds.push(createdRecord.data.id);
                        }
                    } else {
                        const { smartUpload } = await import("../../services/mediaUpload");
                        mediaIds = [];
                        for (let index = 0; index < values.selectedMedia.length; index++) {
                            const media = values.selectedMedia[index];
                            const file: FileAsset = {
                                uri: media.uri,
                                name: media.name,
                                type: media.type,
                                fileSize: media.fileSize,
                                width: media.width,
                                height: media.height,
                            };

                            const result = await smartUpload(profileId, file, {}, ({ bytesSent, totalBytes }) => {
                                const fileProgress = (bytesSent / totalBytes) * 100;
                                const overallProgress = ((index * 100) + fileProgress) / values.selectedMedia.length;
                                setProgress(overallProgress);
                            });
                            mediaIds.push(result.data.id);
                        }
                    }

                    // Complete progress bar animation
                    setProgress(100);
                    // Give it a brief moment to show 100% complete
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    toast.hide(PROGRESS_TOAST_ID);

                    // Switch to LoadingToast to publish post
                    setIsLoading(true);
                    toast.show({
                        id: LOADING_TOAST_ID,
                        duration: 'persistent',
                        component: (props) => (
                            <LoadingToast
                                {...props}
                                loadingText={t("create.toast.publishing")}
                                successText={successText}
                            />
                        ),
                    });
                }

                // Create/Edit post with validated links
                const validLinks = values.links.filter((link: Link) => link.url.trim() && link.label.trim());
                const postData: CreatePostInput = {
                    content: (values.content.trim() + (params.repost_id ? ` <post id="${params.repost_id}" />` : "")).trim() || undefined,
                    location: values.location.trim() || undefined,
                    deezer_id: values.selectedTrack?.deezer_id || null,
                    links: validLinks.length > 0 ? validLinks : undefined,
                    is_ghost: values.isGhost,
                    is_adult: values.isAdult,
                    device: Platform.OS,
                };

                if (params.edit_post_id) {
                    await updatePostMutation.mutateAsync({ postId: params.edit_post_id, data: postData });
                } else {
                    postData.media_ids = mediaIds.length > 0 ? mediaIds : undefined;
                    await createPostMutation.mutateAsync(postData);

                    if (params.repost_id) {
                        sharePost(params.repost_id).catch(err => console.error("Failed to log share count", err));
                    }
                }

                setIsLoading(false);
                // Wait for loading toast success transition/auto-hide before navigating
                await new Promise((resolve) => setTimeout(resolve, 800));

                formikResetForm();
                resetUIState();
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace("/");
                }
            } catch (error: any) {
                console.error("Error creating/editing post:", error);
                setIsLoading(false);
                toast.hide(PROGRESS_TOAST_ID);
                toast.hide(LOADING_TOAST_ID);
                setDialog({
                    visible: true,
                    title: t("create.dialog.errorTitle"),
                    message: error.message || (params.edit_post_id ? "Failed to update post." : t("create.dialog.createFailed")),
                });
            }
        },
    });

    const { values, isSubmitting, handleSubmit, setFieldValue, resetForm: formikResetForm } = formik;

    // ============================================================================
    // Helper Functions
    // ============================================================================

    const resetUIState = useCallback(() => {
        setMusicSearchQuery("");
        setShowMusicSearch(false);
        setShowLinkInput(false);
        setShowLocationInput(false);
        setShowActionBar(true);
        setSelectedProfile(null);
    }, []);

    const handlePickProfile = useCallback((picked: Profile | null) => {
        if (picked && picked.id === myProfile?.id) {
            setSelectedProfile(null);
        } else {
            setSelectedProfile(picked);
        }
    }, [myProfile?.id]);

    const openProfilePicker = useCallback(() => {
        pickerSheetRef.current?.present();
    }, []);

    const resetForm = useCallback(() => {
        formikResetForm();
        resetUIState();
    }, [formikResetForm, resetUIState]);

    // Reset form when navigate to this screen
    useEffect(() => {
        if (trigger > 0) {
            resetForm();
        }
    }, [trigger, resetForm]);



    // Custom submit handler that validates first and shows errors
    const onSubmitPress = useCallback(async () => {
        try {
            // Validate the form using Yup schema
            await createPostValidationSchema.validate(values, { abortEarly: false });
            // If validation passes, call Formik's handleSubmit
            handleSubmit();
        } catch (validationError: any) {
            // Handle Yup validation error
            if (validationError.inner && validationError.inner.length > 0) {
                // Get all field-level errors
                const errorMessages = validationError.inner.map((err: any) => t(err.message as any)).join('\n');
                setDialog({ visible: true, title: t("create.dialog.screenTitle"), message: errorMessages });
            } else if (validationError.message) {
                // Form-level error (like from .test())
                setDialog({ visible: true, title: t("create.dialog.screenTitle"), message: t(validationError.message as any) });
            }
        }
    }, [values, handleSubmit, createPostValidationSchema, t]);

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

        scrollViewHeight.current = layoutMeasurement.height;
        scrollContentHeight.current = contentSize.height;

        // Only hide if there's enough content to scroll AND we're at the end
        const hasScrollableContent = contentSize.height > layoutMeasurement.height + 50;
        const paddingToBottom = 100;
        const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        // Show action bar if:
        // 1. Content is not scrollable (fits in viewport), OR
        // 2. Content is scrollable but we're not at the end
        setShowActionBar(!hasScrollableContent || !isAtEnd);
    }, []);

    const pickMedia = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            setDialog({
                visible: true,
                title: t("create.dialog.permissionTitle"),
                message: t("create.dialog.mediaPermissionRequired"),
            });
            return;
        }

        // Small delay to ensure Android ActivityResultLauncher is registered
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 10 - values.selectedMedia.length,
            });

            if (!result.canceled && result.assets) {
                const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
                    uri: asset.uri,
                    name: asset.fileName || `media_${Date.now()}`,
                    type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
                    fileSize: asset.fileSize,
                    isVideo: asset.type === "video",
                    width: asset.width,
                    height: asset.height,
                }));
                setFieldValue('selectedMedia', [...values.selectedMedia, ...newMedia].slice(0, 10));
            }
        } catch (error: any) {
            console.error("Error picking media:", error);
            // Retry once after a longer delay if it fails
            if (error.message?.includes('unregistered')) {
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images', 'videos'],
                        allowsMultipleSelection: true,
                        quality: 0.8,
                        selectionLimit: 10 - values.selectedMedia.length,
                    });

                    if (!result.canceled && result.assets) {
                        const newMedia: SelectedMedia[] = result.assets.map((asset) => ({
                            uri: asset.uri,
                            name: asset.fileName || `media_${Date.now()}`,
                            type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
                            fileSize: asset.fileSize,
                            isVideo: asset.type === "video",
                            width: asset.width,
                            height: asset.height,
                        }));
                        setFieldValue('selectedMedia', [...values.selectedMedia, ...newMedia].slice(0, 10));
                    }
                } catch {
                    setDialog({
                        visible: true,
                        title: t("create.dialog.errorTitle"),
                        message: t("create.dialog.mediaPickerFailed"),
                    });
                }
            }
        }
    }, [values.selectedMedia, setFieldValue, t]);

    const removeMedia = useCallback((index: number) => {
        setFieldValue('selectedMedia', values.selectedMedia.filter((_: SelectedMedia, i: number) => i !== index));
    }, [values.selectedMedia, setFieldValue]);

    const addLink = useCallback(() => {
        setFieldValue('links', [...values.links, { label: "", url: "" }]);
        setShowLinkInput(true);
    }, [values.links, setFieldValue]);

    const updateLink = useCallback((index: number, field: keyof Link, value: string) => {
        // Use functional updater to avoid closing over stale `values`.
        // Without this, an async label-suggest completing after a URL update
        // would rebuild the links array from a stale snapshot, reverting the URL.
        formik.setValues((prev) => ({
            ...prev,
            links: prev.links.map((link: Link, i: number) =>
                i === index ? { ...link, [field]: value } : link
            ),
        }));
    }, [formik]);

    const removeLink = useCallback((index: number) => {
        const updatedLinks = values.links.filter((_: Link, i: number) => i !== index);
        setFieldValue('links', updatedLinks);
        if (values.links.length === 1) setShowLinkInput(false);
    }, [values.links, setFieldValue]);

    // ============================================================================
    // Computed Values
    // ============================================================================

    const canSubmit = (!!params.edit_post_id || values.content.trim().length > 0 || values.selectedMedia.length > 0) && !isSubmitting;

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <View style={[common.screen]}>
            <View style={createStyles.container}>
                <View style={{ position: 'absolute', top: insets.top + 16, left: 12, zIndex: 1000 }}>
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
                        <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                    </TouchableOpacity>
                </View>

                <Dialog isOpen={dialog.visible} onOpenChange={(open) => !open && setDialog((prev) => ({ ...prev, visible: false }))}>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content style={{ backgroundColor: colors.surface }}>
                            <Dialog.Close />
                            <View style={{ marginBottom: 20, gap: 6 }}>
                                <Dialog.Title>{dialog.title}</Dialog.Title>
                                <Dialog.Description>{dialog.message}</Dialog.Description>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="primary"
                                    onPress={() => {
                                        dialog.onConfirm?.();
                                        setDialog((prev) => ({ ...prev, visible: false }));
                                    }}
                                >
                                    {t("create.dialog.ok")}
                                </Button>
                            </View>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
                <CreateScreenHeader
                    colors={colors}
                    common={common}
                    topPadding={insets.top + 55}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitPress}
                />

                <KeyboardAwareScrollView
                    style={createStyles.scrollView}
                    contentContainerStyle={[
                        createStyles.scrollContent,
                        { paddingBottom: insets.bottom },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    bottomOffset={50}
                >
                    {/* Profile Info */}
                    {profile && (
                        <CreateProfileHeader
                            profile={profile}
                            colors={colors}
                            common={common}
                            isGhost={values.isGhost}
                            isAdult={values.isAdult}
                            useThirdPartyUpload={values.useThirdPartyUpload}
                            onToggleGhost={!params.repost_id ? () => setFieldValue('isGhost', !values.isGhost) : undefined}
                            onToggleThirdPartyUpload={!params.repost_id ? () => setFieldValue('useThirdPartyUpload', !values.useThirdPartyUpload) : undefined}
                            onToggleAdult={!params.repost_id ? () => setFieldValue('isAdult', !values.isAdult) : undefined}
                            isAdmin={isAdmin}
                            onSwitchProfile={isAdmin ? openProfilePicker : undefined}
                        />
                    )}

                    {/* Content Input */}
                    <ContentInput
                        content={values.content}
                        onContentChange={(text) => setFieldValue('content', text)}
                        colors={colors}
                        common={common}
                    />

                    {/* Quoted Repost Preview Card */}
                    {!!params.repost_id && (
                        <Card
                            style={{
                                marginTop: 12,
                                overflow: 'hidden',
                                ...(params.repost_media_url ? { aspectRatio: 1 } : {}),
                            }}
                        >
                            {!!params.repost_media_url ? (
                                <>
                                    <Image
                                        source={params.repost_media_url}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                        contentFit="cover"
                                    />
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                        }}
                                    />
                                    <Card.Body
                                        style={{
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: 24,
                                            flex: 1
                                        }}
                                    >
                                        {!!params.repost_content && (
                                            <Card.Description
                                                style={{
                                                    color: '#FFFFFF',
                                                    fontSize: 18,
                                                    lineHeight: 26,
                                                    fontWeight: '600',
                                                    textAlign: 'center',
                                                    marginBottom: 16,
                                                    textShadowColor: 'rgba(0,0,0,0.3)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 4
                                                }}
                                                numberOfLines={6}
                                            >
                                                {`"${params.repost_content}"`}
                                            </Card.Description>
                                        )}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                            <Ionicons name="repeat" size={14} color="#FFFFFF" />
                                            <Card.Title style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                                                {t('post.dialogs.repostQuote')} @{params.repost_author}
                                            </Card.Title>
                                        </View>
                                    </Card.Body>
                                </>
                            ) : (
                                <Card.Body style={{ gap: 8, padding: 16 }}>
                                    <View style={[common.row, { gap: 6, alignItems: 'center' }]}>
                                        <Ionicons name="repeat" size={16} color={colors.primary} />
                                        <Card.Title style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                                            {t('post.dialogs.repostQuote')} @{params.repost_author}
                                        </Card.Title>
                                    </View>
                                    {!!params.repost_content && (
                                        <Card.Description
                                            style={{
                                                color: colors.onSurface,
                                                fontSize: 14,
                                                lineHeight: 20,
                                            }}
                                            numberOfLines={4}
                                        >
                                            {params.repost_content}
                                        </Card.Description>
                                    )}
                                </Card.Body>
                            )}
                        </Card>
                    )}

                    {/* Location Input */}
                    {!params.repost_id && (
                        <LocationInput
                            visible={showLocationInput}
                            location={values.location}
                            onLocationChange={(text) => setFieldValue('location', text)}
                            onClose={() => {
                                setFieldValue('location', "");
                                setShowLocationInput(false);
                            }}
                            colors={colors}
                            common={common}
                        />
                    )}

                    {/* Selected Media */}
                    {!params.repost_id && (
                        <MediaSection
                            selectedMedia={values.selectedMedia}
                            colors={colors}
                            common={common}
                            onRemoveMedia={removeMedia}
                        />
                    )}

                    {/* Links Section */}
                    {!params.repost_id && (
                        <LinksSection
                            visible={showLinkInput}
                            links={values.links}
                            colors={colors}
                            common={common}
                            onUpdateLink={updateLink}
                            onRemoveLink={removeLink}
                        />
                    )}

                    {/* Music Section */}
                    {!params.repost_id && (
                        <MusicSection
                            visible={showMusicSearch}
                            colors={colors}
                            common={common}
                            searchQuery={musicSearchQuery}
                            onSearchQueryChange={setMusicSearchQuery}
                            selectedTrack={values.selectedTrack}
                            onSelectTrack={(track) => setFieldValue('selectedTrack', track)}
                            musicResults={musicResults?.data || []}
                            isLoading={isMusicLoading}
                        />
                    )}
                </KeyboardAwareScrollView>

                {/* Action Bar */}
                {!params.repost_id && (
                    <CreateActionBar
                        colors={colors}
                        bottomPadding={insets.bottom}
                        visible={showActionBar}
                        selectedMediaCount={values.selectedMedia.length}
                        onPickMedia={pickMedia}
                        hideMediaOption={!!params.edit_post_id}
                        showLocationInput={showLocationInput}
                        hasLocation={!!values.location}
                        onToggleLocation={() => setShowLocationInput(!showLocationInput)}
                        showMusicSearch={showMusicSearch}
                        selectedTrack={values.selectedTrack}
                        onToggleMusic={() => setShowMusicSearch(!showMusicSearch)}
                        linksCount={values.links.length}
                        onAddLink={addLink}
                    />
                )}
            </View>

            {isAdmin && (
                <ProfilePickerSheet
                    ref={pickerSheetRef}
                    selectedProfileId={activeProfile?.id ?? null}
                    onSelect={handlePickProfile}
                />
            )}
        </View>
    );
};

export default CreateScreen;