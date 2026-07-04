import { FlexText } from '@/components/FlexText';
import { useAddSocialLink, useDeleteSocialLink, useUpdateSocialLink } from '@/services/sociallink';
import { LinkPreview } from '@flyerhq/react-native-link-preview';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import EarthIcon from "@/assets/images/svg/earth.svg";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from 'expo-image';
import NitroInAppBrowser from 'react-native-nitro-in-app-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileLink } from '../../../types/profilelink';
import { useSheetBackHandler } from "./useSheetBackHandler";

const Earth = ({ size, ...props }: any) => <EarthIcon width={size} height={size} {...props} />;

// ============================================================================
// Props & Constants
// ============================================================================

interface SocialSheetProps {
    data: ProfileLink[];
    profileId?: string;       // Required for add/edit/delete mutations
    isOwner?: boolean;        // Show edit controls only for profile owner
    onEndReached?: () => void;
}

const PLATFORMS = [
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'X', label: 'X (Twitter)' },
    { value: 'Threads', label: 'Threads' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'GitHub', label: 'GitHub' },
    { value: 'Twitch', label: 'Twitch' },
    { value: 'Discord', label: 'Discord' },
    { value: 'Telegram', label: 'Telegram' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Snapchat', label: 'Snapchat' },
    { value: 'Other', label: 'Other / Website' }
];

// Helper to get brand colors and icons
const getPlatformDetails = (platform: string, theme: 'light' | 'dark') => {
    const p = platform?.toLowerCase() || '';

    let icon = 'link-outline';
    let color = theme === 'dark' ? '#ffffff' : '#000000';

    if (p.includes('twitter') || p.includes('x')) {
        icon = p.includes('x') ? 'logo-x' : 'logo-twitter';
        color = '#1DA1F2'; // Twitter Blue
        if (p.includes('x')) color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('facebook')) {
        icon = 'logo-facebook';
        color = '#1877F2';
    } else if (p.includes('instagram')) {
        icon = 'logo-instagram';
        color = '#E4405F';
    } else if (p.includes('linkedin')) {
        icon = 'logo-linkedin';
        color = '#0A66C2';
    } else if (p.includes('github')) {
        icon = 'logo-github';
        color = theme === 'dark' ? '#ffffff' : '#181717';
    } else if (p.includes('youtube')) {
        icon = 'logo-youtube';
        color = '#FF0000';
    } else if (p.includes('tiktok')) {
        icon = 'logo-tiktok';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('whatsapp')) {
        icon = 'logo-whatsapp';
        color = '#25D366';
    } else if (p.includes('telegram')) {
        icon = 'logo-telegram';
        color = '#229ED9';
    } else if (p.includes('snapchat')) {
        icon = 'logo-snapchat';
        color = '#FFFC00';
    } else if (p.includes('threads')) {
        icon = 'logo-threads';
        color = theme === 'dark' ? '#ffffff' : '#000000';
    } else if (p.includes('discord')) {
        icon = 'logo-discord';
        color = theme === 'dark' ? '#ffffff' : '#7289DA';
    } else if (p.includes('twitch')) {
        icon = 'logo-twitch';
        color = '#9146FF';
    } else if (p.includes('reddit')) {
        icon = 'logo-reddit';
        color = '#FF4500';
    } else if (p.includes('soundcloud')) {
        icon = 'logo-soundcloud';
        color = '#FF5500';
    } else if (p.includes('paypal')) {
        icon = 'logo-paypal';
        color = '#003087';
    } else if (p.includes('cashapp')) {
        icon = 'logo-cashapp';
        color = '#00D632';
    }

    return { icon, color };
};

// Clean URL formatter
const FormattedLink = ({ url, username, common, color }: { url: string, username?: string, common: any, color: string }) => {
    let display = username || url;

    if (!username && url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.pathname.length > 1 && !urlObj.pathname.includes('/p/')) {
                const segment = urlObj.pathname.split('/').filter(Boolean).pop() || '';
                display = segment.startsWith('@') ? segment : '@' + segment;
            } else {
                display = urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : '');
            }
        } catch (e) {
            display = url;
        }
    } else if (username && !username.startsWith('@') && !username.includes('/') && !username.includes('.')) {
        display = '@' + username;
    }

    return (
        <FlexText style={[common.bodySmall, { color: color, opacity: 0.6, marginTop: 2 }]} numberOfLines={1}>
            {display}
        </FlexText>
    );
};

// Reusable Card Component
const LinkCard = ({
    onPress,
    iconNode,
    title,
    url,
    username,
    colors,
    common,
    isOwner,
    onEdit,
    onDelete
}: {
    onPress: () => void,
    iconNode: React.ReactNode,
    title: string,
    url: string,
    username?: string,
    colors: any,
    common: any,
    isOwner?: boolean,
    onEdit?: () => void,
    onDelete?: () => void
}) => {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                marginBottom: 12,
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
                <View style={{ marginRight: 16 }}>
                    {iconNode}
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                        {title}
                    </FlexText>
                    <FormattedLink url={url} username={username} common={common} color={colors.text} />
                </View>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    onPress={onPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.actionButton}
                >
                    <Ionicons name="open-outline" size={20} color={colors.muted || '#999'} />
                </TouchableOpacity>

                {isOwner && onEdit && (
                    <TouchableOpacity
                        onPress={onEdit}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.actionButton}
                    >
                        <Ionicons name="pencil-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                )}

                {isOwner && onDelete && (
                    <TouchableOpacity
                        onPress={onDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const SocialLinkItem = memo(({
    item,
    colors,
    common,
    theme,
    isOwner,
    onEdit,
    onDelete
}: {
    item: ProfileLink,
    colors: any,
    common: any,
    theme: 'light' | 'dark',
    isOwner?: boolean,
    onEdit?: () => void,
    onDelete?: () => void
}) => {
    const { t } = useTranslation();
    const { icon, color } = getPlatformDetails(item.platform, theme);
    const isGeneric = icon === 'link-outline';

    const handleOpenLink = useCallback(async () => {
        try {
            await NitroInAppBrowser.open(item.url, {
                presentationStyle: 'fullScreen',
                dismissButtonLabel: 'close',
            });
        } catch (error) {
            console.error(error);
        }
    }, [item.url]);

    if (isGeneric) {
        return (
            <LinkPreview
                text={item.url}
                enableAnimation={true}
                renderLinkPreview={({ previewData }) => {
                    const imageUrl = previewData?.image?.url;

                    const IconNode = imageUrl ? (
                        <ExpoImage
                            source={{ uri: imageUrl }}
                            style={{ width: 48, height: 48, borderRadius: 999 }}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                            <Earth size={24} color={colors.text} />
                        </View>
                    );

                    return (
                        <LinkCard
                            onPress={handleOpenLink}
                            iconNode={IconNode}
                            title={previewData?.title || item.platform || t('profile.sheets.social.website', 'Website')}
                            url={item.url}
                            username={item.label || undefined}
                            colors={colors}
                            common={common}
                            isOwner={isOwner}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    );
                }}
            />
        );
    }

    const IconNode = (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon as any} size={24} color={color} />
        </View>
    );

    return (
        <LinkCard
            onPress={handleOpenLink}
            iconNode={IconNode}
            title={item.platform}
            url={item.url}
            username={item.label || undefined}
            colors={colors}
            common={common}
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
});
SocialLinkItem.displayName = 'SocialLinkItem';

// ============================================================================
// Add / Edit Social Link Stacked Sheet
// ============================================================================

interface AddEditSocialSheetProps {
    profileId: string;
    onSuccess: () => void;
}

const AddEditSocialSheet = memo(
    forwardRef<TrueSheet, AddEditSocialSheetProps>(({ profileId, onSuccess }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const [linkToEdit, setLinkToEdit] = useState<ProfileLink | null>(null);
        const [platform, setPlatform] = useState('Facebook');
        const [customPlatform, setCustomPlatform] = useState('');
        const [url, setUrl] = useState('');
        const [label, setLabel] = useState('');
        const [errors, setErrors] = useState<Record<string, string>>({});

        const { mutate: addSocialLink, isPending: isAdding } = useAddSocialLink(profileId);
        const { mutate: updateSocialLink, isPending: isUpdating } = useUpdateSocialLink(profileId);
        const isSaving = isAdding || isUpdating;

        useImperativeHandle(ref, () => ({
            present: (editingLink?: ProfileLink) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;

                if (editingLink) {
                    setLinkToEdit(editingLink);
                    const matchedPlatform = PLATFORMS.find(p => p.value.toLowerCase() === editingLink.platform.toLowerCase());
                    if (matchedPlatform && matchedPlatform.value !== 'Other') {
                        setPlatform(matchedPlatform.value);
                        setCustomPlatform('');
                    } else {
                        setPlatform('Other');
                        setCustomPlatform(editingLink.platform);
                    }
                    setUrl(editingLink.url);
                    setLabel(editingLink.label || '');
                } else {
                    setLinkToEdit(null);
                    setPlatform('Facebook');
                    setCustomPlatform('');
                    setUrl('');
                    setLabel('');
                }
                setErrors({});
                return sheetRef.current?.present() || Promise.resolve();
            },
            dismiss: (animated?: boolean) => {
                if (!isPresented.current) return Promise.resolve();
                isPresented.current = false;
                return sheetRef.current?.dismiss(animated) || Promise.resolve();
            }
        } as any), []);

        const handleSave = useCallback(() => {
            const newErrors: Record<string, string> = {};
            const finalPlatform = platform === 'Other' ? customPlatform.trim() : platform;

            if (!finalPlatform) {
                newErrors.platform = t('profile.sheets.social.platformRequired', 'Platform name is required');
            }
            if (!url.trim()) {
                newErrors.url = t('profile.sheets.social.urlRequired', 'URL is required');
            } else {
                let testUrl = url.trim();
                if (!/^https?:\/\//i.test(testUrl)) {
                    testUrl = 'https://' + testUrl;
                }
                try {
                    new URL(testUrl);
                } catch (e) {
                    newErrors.url = t('profile.sheets.social.invalidUrl', 'Please enter a valid URL');
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({});
            Keyboard.dismiss();

            let formattedUrl = url.trim();
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }

            const payload = {
                platform: finalPlatform,
                url: formattedUrl,
                label: label.trim() || null,
            };

            const done = () => {
                onSuccess();
                sheetRef.current?.dismiss();
            };

            if (linkToEdit) {
                updateSocialLink({
                    linkId: linkToEdit.id,
                    ...payload,
                }, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.social.errorTitle', 'Error'),
                            t('profile.sheets.social.updateError', 'Failed to update social link')
                        );
                    }
                });
            } else {
                addSocialLink(payload, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.social.errorTitle', 'Error'),
                            t('profile.sheets.social.addError', 'Failed to add social link')
                        );
                    }
                });
            }
        }, [platform, customPlatform, url, label, linkToEdit, addSocialLink, updateSocialLink, onSuccess, t]);

        return (
            <TrueSheet
                ref={sheetRef}
                scrollable
                detents={[0.92]}
                cornerRadius={32}
                backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                grabberOptions={{ color: colors.muted || '#C4C4C4', height: 5, width: 40 }}
                onDidPresent={() => {
                    isPresented.current = true;
                    backHandler.onDidPresent();
                }}
                onDidDismiss={() => {
                    isPresented.current = false;
                    backHandler.onDidDismiss();
                }}
            >
                <ScrollView style={formStyles.container}>
                    {/* Header */}
                    <View style={formStyles.header}>
                        <View>
                            <FlexText style={[common.heading, { fontSize: 22 }]}>
                                {linkToEdit ? t('profile.sheets.social.editTitle', 'Edit Social Link') : t('profile.sheets.social.addTitle', 'Add Social Link')}
                            </FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                                {t('profile.sheets.social.addSubtitle', 'Enter your profile details below')}
                            </FlexText>
                        </View>
                    </View>

                    {/* Platform Selector (wrapping Chips) */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>{t('profile.sheets.social.platformLabel', 'Platform')}</FlexText>
                        <View style={formStyles.chipsContainer}>
                            {PLATFORMS.map((opt) => {
                                const isSelected = platform === opt.value;
                                const { icon } = getPlatformDetails(opt.value, theme);

                                return (
                                    <Chip
                                        key={opt.value}
                                        onPress={() => setPlatform(opt.value)}
                                        variant={isSelected ? "primary" : "secondary"}
                                        color={isSelected ? "accent" : "default"}
                                        style={[
                                            formStyles.chip,
                                            !isSelected && {
                                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                borderColor: 'transparent'
                                            }
                                        ]}
                                    >
                                        <Ionicons
                                            name={icon as any}
                                            size={14}
                                            color={isSelected ? '#ffffff' : (theme === 'dark' ? '#cccccc' : '#555555')}
                                        />
                                        <Chip.Label style={{
                                            color: isSelected ? '#ffffff' : colors.text,
                                            fontWeight: isSelected ? '600' : '400',
                                            fontSize: 13,
                                            marginLeft: 4,
                                        }}>
                                            {opt.label}
                                        </Chip.Label>
                                    </Chip>
                                );
                            })}
                        </View>
                    </View>

                    {/* Custom Platform Name Input */}
                    {platform === 'Other' && (
                        <View style={formStyles.fieldGroup}>
                            <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                                {t('profile.sheets.social.customPlatformLabel', 'Platform Name')}
                            </FlexText>
                            <View style={[
                                formStyles.inputContainer,
                                {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    borderColor: errors.platform ? '#ff4444' : 'transparent',
                                    borderWidth: errors.platform ? 1 : 0,
                                }
                            ]}>
                                <Ionicons name="pencil-outline" size={18} color={colors.muted} />
                                <TextInput
                                    value={customPlatform}
                                    onChangeText={setCustomPlatform}
                                    placeholder={t('profile.sheets.social.customPlatformPlaceholder', 'e.g. Medium, Substack')}
                                    placeholderTextColor={colors.muted}
                                    style={[formStyles.textInput, { color: colors.text }]}
                                    autoCorrect={false}
                                />
                                {customPlatform.length > 0 && (
                                    <TouchableOpacity onPress={() => setCustomPlatform("")}>
                                        <Ionicons name="close-circle" size={18} color={colors.muted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors.platform && (
                                <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                    {errors.platform}
                                </FlexText>
                            )}
                        </View>
                    )}

                    {/* URL Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.social.urlLabel', 'URL / Link')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.url ? '#ff4444' : 'transparent',
                                borderWidth: errors.url ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="link-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={url}
                                onChangeText={setUrl}
                                placeholder="https://facebook.com/username"
                                placeholderTextColor={colors.muted}
                                autoCapitalize="none"
                                keyboardType="url"
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {url.length > 0 && (
                                <TouchableOpacity onPress={() => setUrl("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.url && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.url}
                            </FlexText>
                        )}
                    </View>

                    {/* Label Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.social.customLabel', 'Username or Label (Optional)')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            }
                        ]}>
                            <Ionicons name="bookmark-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={label}
                                onChangeText={setLabel}
                                placeholder="e.g. @myusername or My page"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {label.length > 0 && (
                                <TouchableOpacity onPress={() => setLabel("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Submit Button (HeroUI Button with Loader) */}
                    <Button
                        variant="primary"
                        onPress={handleSave}
                        isDisabled={isSaving}
                        style={[formStyles.submitButton, { opacity: isSaving ? 0.6 : 1 }]}
                    >
                        {isSaving ? (
                            <Spinner color="#ffffff" size="sm" />
                        ) : (
                            <Button.Label style={formStyles.submitText}>
                                {linkToEdit ? t('profile.sheets.social.save', 'Save Changes') : t('profile.sheets.social.add', 'Add Link')}
                            </Button.Label>
                        )}
                    </Button>
                </ScrollView>
            </TrueSheet>
        );
    })
);

AddEditSocialSheet.displayName = 'AddEditSocialSheet';

// ============================================================================
// Main SocialSheet Component
// ============================================================================

export const SocialSheet = memo(forwardRef<TrueSheet, SocialSheetProps>(
    ({ data, profileId, isOwner = false, onEndReached }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const inset = useSafeAreaInsets();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const addEditSheetRef = useRef<TrueSheet>(null);

        const { mutate: deleteSocialLink } = useDeleteSocialLink(profileId ?? '');

        useImperativeHandle(ref, () => ({
            present: (index?: number, animated?: boolean) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;
                return sheetRef.current?.present(index, animated) || Promise.resolve();
            },
            dismiss: (animated?: boolean) => {
                if (!isPresented.current) return Promise.resolve();
                isPresented.current = false;
                return sheetRef.current?.dismiss(animated) || Promise.resolve();
            },
            resize: (index: number) => {
                return sheetRef.current?.resize(index) || Promise.resolve();
            },
            dismissStack: (animated?: boolean) => {
                return sheetRef.current?.dismissStack(animated) || Promise.resolve();
            },
        } as any), []);

        const handleDelete = useCallback((linkId: string) => {
            Alert.alert(
                t('profile.sheets.social.deleteTitle', 'Delete Social Link'),
                t('profile.sheets.social.deleteMessage', 'Are you sure you want to remove this social link?'),
                [
                    { text: t('profile.sheets.social.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('profile.sheets.social.delete', 'Delete'),
                        style: 'destructive',
                        onPress: () => {
                            deleteSocialLink(linkId);
                        },
                    },
                ]
            );
        }, [deleteSocialLink, t]);

        const handleOpenAddEditSheet = useCallback((editingLink?: ProfileLink) => {
            (addEditSheetRef.current as any)?.present(editingLink);
        }, []);

        if ((!data || data.length === 0) && !isOwner) return null;

        const listHeader = (
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>
                        {t('profile.sheets.social.title', 'Social Links')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.social.subtitle', 'Connect and share your social profiles')}
                    </FlexText>
                </View>
                {isOwner && profileId && (
                    <TouchableOpacity
                        onPress={() => handleOpenAddEditSheet()}
                        style={[styles.addLinkButton, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="add" size={20} color={colors.text} />
                        <FlexText style={[common.bodySmall, { color: colors.text, marginLeft: 4, fontWeight: '600' }]}>
                            {t('profile.sheets.social.addLink', 'Add')}
                        </FlexText>
                    </TouchableOpacity>
                )}
            </View>
        );

        return (
            <>
                <TrueSheet
                    ref={sheetRef}
                    scrollable={true}
                    backgroundColor={theme === 'dark' ? colors.containerContent : '#ffffff'}
                    grabberOptions={{
                        color: colors.muted || "#C4C4C4",
                        height: 5,
                        width: 40,
                    }}
                    cornerRadius={32}
                    detents={[0.7, 1]}
                    onDidPresent={() => {
                        isPresented.current = true;
                        backHandler.onDidPresent();
                    }}
                    onDidDismiss={() => {
                        isPresented.current = false;
                        backHandler.onDidDismiss();
                    }}
                >
                    <FlatList
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.5}
                        data={data}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="link-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                                    {t('profile.sheets.social.emptyList', 'No social links connected')}
                                </FlexText>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={{ paddingHorizontal: 24 }}>
                                <SocialLinkItem
                                    item={item}
                                    colors={colors}
                                    common={common}
                                    theme={theme}
                                    isOwner={isOwner}
                                    onEdit={isOwner ? () => handleOpenAddEditSheet(item) : undefined}
                                    onDelete={isOwner ? () => handleDelete(item.id) : undefined}
                                />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 40 + inset.bottom }}
                    />
                </TrueSheet>

                {/* Stacked Add/Edit Social Link Sheet */}
                {isOwner && profileId && (
                    <AddEditSocialSheet
                        ref={addEditSheetRef}
                        profileId={profileId}
                        onSuccess={() => { }}
                    />
                )}
            </>
        );
    }
));

SocialSheet.displayName = 'SocialSheet';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    addLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    }
});

const formStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        height: 36,
        borderRadius: 18,
    },
    customLabel: {
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 999,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    submitButton: {
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    submitText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    }
});