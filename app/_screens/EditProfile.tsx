import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { useProfile, useUpdateProfile } from '@/services/userprofile';
import { createCommonStyles } from '@/styles/common';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { parseServerDate, formatToServerDate } from '@/utils/date';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import dayjs from 'dayjs';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createMaterialTopTabNavigator } from "expo-router/build/react-navigation/material-top-tabs";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Spinner } from "heroui-native/spinner";
import { Switch } from "heroui-native/switch";
import { Tabs } from "heroui-native/tabs";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
    Alert,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();


// ============================================================================
// Form Context
// ============================================================================

interface FormContextType {
    formData: any;
    setField: (path: string, value: any) => void;
    errors: Record<string, string>;
    colors: any;
    common: any;
    theme: 'light' | 'dark';
    t: any;
    isAdmin: boolean;
}

const FormContext = createContext<FormContextType | null>(null);

const useForm = () => {
    const context = useContext(FormContext);
    if (!context) throw new Error('useForm must be used within FormProvider');
    return context;
};

// ============================================================================
// Reusable Premium Input Container
// ============================================================================

const FormInput = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    error,
    multiline = false,
    height,
    ...props
}: {
    label: string;
    icon: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
    error?: string;
    multiline?: boolean;
    height?: number;
    [key: string]: any;
}) => {
    const { colors, common, theme } = useForm();
    return (
        <View style={formStyles.fieldGroup}>
            <FlexText style={[common.bodySmall, formStyles.customLabel]}>{label}</FlexText>
            <View style={[
                formStyles.inputContainer,
                {
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: error ? '#ff4444' : 'transparent',
                    borderWidth: error ? 1 : 0,
                    height: height ?? (multiline ? 90 : 48),
                    borderRadius: multiline ? 16 : 999,
                    alignItems: multiline ? 'flex-start' : 'center',
                    paddingVertical: multiline ? 12 : 0,
                }
            ]}>
                <Ionicons name={icon as any} size={18} color={colors.muted} style={multiline ? { marginTop: 2 } : undefined} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.muted}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    style={[
                        formStyles.textInput,
                        {
                            color: colors.text,
                            textAlignVertical: multiline ? 'top' : 'center',
                            height: '100%',
                        }
                    ]}
                    autoCorrect={false}
                    autoCapitalize="none"
                    {...props}
                />
                {value.length > 0 && !multiline && (
                    <TouchableOpacity onPress={() => onChangeText('')}>
                        <Ionicons name="close-circle" size={18} color={colors.muted} />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                    {error}
                </FlexText>
            )}
        </View>
    );
};



// ============================================================================
// Expandable Premium Date Picker Field
// ============================================================================

const FormDatePicker = ({
    label,
    icon,
    value,
    onChange,
    placeholder,
    error
}: {
    label: string;
    icon: string;
    value: string;
    onChange: (dateString: string) => void;
    placeholder?: string;
    error?: string;
}) => {
    const { colors, common, theme } = useForm();
    const [showPicker, setShowPicker] = useState(false);

    const initialDate = useMemo(() => {
        if (!value) {
            const now = new Date();
            return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        }
        const [year, month, day] = value.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }, [value]);

    return (
        <View style={formStyles.fieldGroup}>
            <FlexText style={[common.bodySmall, formStyles.customLabel]}>{label}</FlexText>
            <TouchableOpacity
                onPress={() => {
                    Keyboard.dismiss();
                    setShowPicker(!showPicker);
                }}
                activeOpacity={0.7}
                style={[
                    formStyles.inputContainer,
                    {
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        borderColor: error ? '#ff4444' : 'transparent',
                        borderWidth: error ? 1 : 0,
                        borderRadius: 999, padding: 16
                    }
                ]}
            >
                <Ionicons name={icon as any} size={18} color={colors.muted} />
                <View style={{ flex: 1, paddingLeft: 8 }}>
                    <FlexText style={{ color: value ? colors.text : colors.muted, fontSize: 16 }}>
                        {value ? dayjs(value).format('MMMM DD, YYYY') : placeholder}
                    </FlexText>
                </View>
                {value.length > 0 && (
                    <TouchableOpacity onPress={(e) => {
                        e.stopPropagation();
                        onChange('');
                    }}>
                        <Ionicons name="close-circle" size={18} color={colors.muted} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {showPicker && (
                <View style={{ marginTop: 8, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 8, alignItems: 'center' }}>
                    <DateTimePicker
                        value={initialDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        presentation={Platform.OS === 'android' ? 'dialog' : undefined}
                        onValueChange={(_event, date) => {
                            setShowPicker(false);
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            onChange(`${year}-${month}-${day}`);
                        }}
                        onDismiss={() => {
                            setShowPicker(false);
                        }}
                        themeVariant={theme}
                    />
                </View>
            )}

            {error && (
                <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                    {error}
                </FlexText>
            )}
        </View>
    );
};

// ============================================================================
// Premium Chip Selector Grid
// ============================================================================

const FormChipSelector = ({
    label,
    icon,
    value,
    onSelect,
    options
}: {
    label: string;
    icon: string;
    value: string;
    onSelect: (val: string) => void;
    options: { value: string; label: string }[];
}) => {
    const { colors, common } = useForm();
    return (
        <View style={formStyles.fieldGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                <Ionicons name={icon as any} size={16} color={colors.muted} style={{ marginRight: 6 }} />
                <FlexText style={[common.bodySmall, { fontWeight: '600' }]}>{label}</FlexText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {options.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                        <Chip
                            key={opt.value}
                            variant={isSelected ? "primary" : "secondary"}
                            onPress={() => onSelect(opt.value)}
                            style={{
                                borderColor: isSelected ? colors.secondary : colors.muted,
                                backgroundColor: isSelected ? colors.secondary + '15' : 'transparent',
                            }}
                        >
                            <Chip.Label style={{ color: isSelected ? colors.secondary : colors.text, fontWeight: isSelected ? '700' : '400' }}>
                                {opt.label}
                            </Chip.Label>
                        </Chip>
                    );
                })}
            </View>
        </View>
    );
};

// ============================================================================
// Tab Screens
// ============================================================================

const BasicTab = () => {
    const { formData, setField, errors, colors } = useForm();
    return (
        <KeyboardAwareScrollView style={[formStyles.tabScroll, { backgroundColor: colors.background }]} contentContainerStyle={formStyles.tabContent}>
            <FormInput
                label="Full Name"
                icon="person-outline"
                value={formData.name || ''}
                onChangeText={(v) => setField('name', v)}
                placeholder="e.g. John Doe"
                error={errors.name}
            />
            <FormInput
                label="Username"
                icon="at-outline"
                value={formData.username || ''}
                onChangeText={(v) => setField('username', v)}
                placeholder="unique_username"
                error={errors.username}
            />
            <FormInput
                label="Email Address"
                icon="mail-outline"
                value={formData.email || ''}
                onChangeText={(v) => setField('email', v)}
                placeholder="e.g. john@example.com"
                keyboardType="email-address"
            />
            <FormInput
                label="Phone Number"
                icon="call-outline"
                value={formData.phone || ''}
                onChangeText={(v) => setField('phone', v)}
                placeholder="e.g. +1234567890"
                keyboardType="phone-pad"
            />
            <FormDatePicker
                label="Birthday"
                icon="calendar-outline"
                value={formData.birthday || ''}
                onChange={(v) => setField('birthday', v)}
                placeholder="Select birth date"
            />
            <FormChipSelector
                label="Gender"
                icon="people-outline"
                value={formData.gender || ''}
                onSelect={(v) => setField('gender', v)}
                options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'non-binary', label: 'Non-binary' },
                    { value: 'other', label: 'Other' }
                ]}
            />
            <FormInput
                label="Pronouns"
                icon="chatbubbles-outline"
                value={formData.pronouns || ''}
                onChangeText={(v) => setField('pronouns', v)}
                placeholder="e.g. he/him, she/her"
            />
        </KeyboardAwareScrollView>
    );
};

const MediaTab = () => {
    const { formData, setField, colors, theme } = useForm();
    const avatarUrl = formData.avatar_url;
    const coverUrl = formData.cover_url;

    return (
        <KeyboardAwareScrollView style={[formStyles.tabScroll, { backgroundColor: colors.background }]} contentContainerStyle={formStyles.tabContent}>
            {/* Real-time Previews */}
            <View style={{ marginBottom: 24, gap: 16 }}>
                <FlexText style={{ fontWeight: '600', fontSize: 16, color: colors.text }}>Live Visual Preview</FlexText>

                {/* Simulated Header Preview */}
                <View style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 16,
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderWidth: 1,
                    borderColor: colors.divider,
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {coverUrl ? (
                        <ExpoImage source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#3b5998', opacity: 0.1 }]} />
                    )}
                    <View style={{ position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            borderWidth: 3,
                            borderColor: colors.background,
                            backgroundColor: colors.card,
                            overflow: 'hidden'
                        }}>
                            {avatarUrl ? (
                                <ExpoImage source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <View style={{ width: '100%', height: '100%', backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="person" size={24} color="#fff" />
                                </View>
                            )}
                        </View>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <FlexText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{formData.name || 'Your Name'}</FlexText>
                        </View>
                    </View>
                </View>
            </View>

            <FormInput
                label="Profile Picture URL"
                icon="image-outline"
                value={formData.avatar_url || ''}
                onChangeText={(v) => setField('avatar_url', v)}
                placeholder="https://domain.com/avatar.jpg"
                keyboardType="url"
            />
            <FormInput
                label="Cover Image URL"
                icon="images-outline"
                value={formData.cover_url || ''}
                onChangeText={(v) => setField('cover_url', v)}
                placeholder="https://domain.com/cover.jpg"
                keyboardType="url"
            />
            <FormInput
                label="3D Emoji Image URL"
                icon="happy-outline"
                value={formData.metadata?.threed_emoji || ''}
                onChangeText={(v) => setField('metadata.threed_emoji', v)}
                placeholder="https://domain.com/emoji.png"
                keyboardType="url"
            />
        </KeyboardAwareScrollView>
    );
};

const AboutTab = () => {
    const { formData, setField, colors } = useForm();
    return (
        <KeyboardAwareScrollView style={[formStyles.tabScroll, { backgroundColor: colors.background }]} contentContainerStyle={formStyles.tabContent}>
            <FormInput
                label="Bio"
                icon="document-text-outline"
                value={formData.bio || ''}
                onChangeText={(v) => setField('bio', v)}
                placeholder="Tell others about yourself..."
                multiline
                height={100}
            />
            <FormInput
                label="College"
                icon="school-outline"
                value={formData.college || ''}
                onChangeText={(v) => setField('college', v)}
                placeholder="e.g. Stanford University"
            />
            <FormInput
                label="High School"
                icon="ribbon-outline"
                value={formData.highschool || ''}
                onChangeText={(v) => setField('highschool', v)}
                placeholder="e.g. Central High School"
            />
            <FormInput
                label="Hometown / City & Country"
                icon="home-outline"
                value={formData.hometown || ''}
                onChangeText={(v) => setField('hometown', v)}
                placeholder="e.g. Mountain View, California"
            />
            <FormInput
                label="Website URL"
                icon="globe-outline"
                value={formData.website || ''}
                onChangeText={(v) => setField('website', v)}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
            />
        </KeyboardAwareScrollView>
    );
};

const DetailsTab = () => {
    const { formData, setField, colors } = useForm();
    return (
        <KeyboardAwareScrollView style={[formStyles.tabScroll, { backgroundColor: colors.background }]} contentContainerStyle={formStyles.tabContent}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <FormInput
                        label="Height (cm)"
                        icon="resize-outline"
                        value={formData.metadata?.height ? String(formData.metadata.height) : ''}
                        onChangeText={(v) => setField('metadata.height', v ? Number(v) : '')}
                        placeholder="175"
                        keyboardType="numeric"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <FormInput
                        label="Weight (kg)"
                        icon="speedometer-outline"
                        value={formData.metadata?.weight ? String(formData.metadata.weight) : ''}
                        onChangeText={(v) => setField('metadata.weight', v ? Number(v) : '')}
                        placeholder="70"
                        keyboardType="numeric"
                    />
                </View>
            </View>
            <FormInput
                label="Hobby"
                icon="musical-notes-outline"
                value={formData.hobby || ''}
                onChangeText={(v) => setField('hobby', v)}
                placeholder="e.g. Singing, Reading"
            />
            <FormInput
                label="Talent"
                icon="color-palette-outline"
                value={formData.talent || ''}
                onChangeText={(v) => setField('talent', v)}
                placeholder="e.g. Playing Piano, Painting"
            />
            <FormDatePicker
                label="Married Date"
                icon="heart-outline"
                value={formData.married_date || ''}
                onChange={(v) => setField('married_date', v)}
                placeholder="Select date"
            />
            <FormInput
                label="License Plate"
                icon="car-outline"
                value={formData.license_plate || ''}
                onChangeText={(v) => setField('license_plate', v)}
                placeholder="e.g. ABC-1234"
            />
        </KeyboardAwareScrollView>
    );
};

const FacebookAdminTab = () => {
    const { formData, setField, isAdmin, colors } = useForm();
    return (
        <KeyboardAwareScrollView style={[formStyles.tabScroll, { backgroundColor: colors.background }]} contentContainerStyle={formStyles.tabContent}>
            <FlexText style={{ fontWeight: '600', fontSize: 16, marginBottom: 12, color: colors.text }}>Facebook Profile Urls</FlexText>
            <FormInput
                label="Highlight Reel URL"
                icon="logo-facebook"
                value={formData.metadata?.facebook?.highlight || ''}
                onChangeText={(v) => setField('metadata.facebook.highlight', v)}
                placeholder="Facebook Highlight URL"
                keyboardType="url"
            />
            <FormInput
                label="Posts Feed URL"
                icon="logo-facebook"
                value={formData.metadata?.facebook?.posts || ''}
                onChangeText={(v) => setField('metadata.facebook.posts', v)}
                placeholder="Facebook Posts Feed URL"
                keyboardType="url"
            />
            <FormInput
                label="Photos Album URL"
                icon="logo-facebook"
                value={formData.metadata?.facebook?.photos || ''}
                onChangeText={(v) => setField('metadata.facebook.photos', v)}
                placeholder="Facebook Photos URL"
                keyboardType="url"
            />
            <FormInput
                label="Videos Feed URL"
                icon="logo-facebook"
                value={formData.metadata?.facebook?.videos || ''}
                onChangeText={(v) => setField('metadata.facebook.videos', v)}
                placeholder="Facebook Videos URL"
                keyboardType="url"
            />
            <FormInput
                label="Joined Groups URL"
                icon="logo-facebook"
                value={formData.metadata?.facebook?.joined_groups || ''}
                onChangeText={(v) => setField('metadata.facebook.joined_groups', v)}
                placeholder="Facebook Groups URL"
                keyboardType="url"
            />

            {isAdmin && (
                <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 16 }}>
                    <FlexText style={{ fontWeight: '700', fontSize: 16, color: '#ff4444', marginBottom: 4 }}>Admin System Overrides</FlexText>
                    <FlexText style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>These privileges are restricted to system administrators.</FlexText>

                    <View style={[formStyles.toggleRow, { borderBottomColor: colors.divider }]}>
                        <View style={{ flex: 1 }}>
                            <FlexText style={{ fontWeight: '600', color: colors.text }}>Verified Badge</FlexText>
                            <FlexText style={{ fontSize: 12, color: colors.muted }}>Display verified check badge on profile</FlexText>
                        </View>
                        <Switch
                            isSelected={!!formData.is_verified}
                            onSelectedChange={(checked: boolean) => setField('is_verified', checked)}
                        />
                    </View>

                    <View style={[formStyles.toggleRow, { borderBottomColor: colors.divider }]}>
                        <View style={{ flex: 1 }}>
                            <FlexText style={{ fontWeight: '600', color: colors.text }}>System Administrator</FlexText>
                            <FlexText style={{ fontSize: 12, color: colors.muted }}>Grant full dashboard and edit access</FlexText>
                        </View>
                        <Switch
                            isSelected={!!formData.is_admin}
                            onSelectedChange={(checked: boolean) => setField('is_admin', checked)}
                        />
                    </View>

                    <View style={[formStyles.toggleRow, { borderBottomColor: colors.divider }]}>
                        <View style={{ flex: 1 }}>
                            <FlexText style={{ fontWeight: '600', color: colors.text }}>Confidential Profile</FlexText>
                            <FlexText style={{ fontSize: 12, color: colors.muted }}>Hide profile from lookups & listing pages</FlexText>
                        </View>
                        <Switch
                            isSelected={!!formData.is_confidential}
                            onSelectedChange={(checked: boolean) => setField('is_confidential', checked)}
                        />
                    </View>
                </View>
            )}
        </KeyboardAwareScrollView>
    );
};

// ============================================================================
// Main EditProfileScreen Component
// ============================================================================

const isDeepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!isDeepEqual(a[key], b[key])) return false;
    }
    return true;
};

const EditProfileForm = ({ targetProfile, myProfile }: { targetProfile: any, myProfile: any }) => {
    const router = useRouter();
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

    const [formData, setFormData] = useState<any>(() => {
        const defaultMetadata = {
            height: '',
            weight: '',
            threed_emoji: '',
            banking: {},
            facebook: {
                highlight: '',
                posts: '',
                photos: '',
                videos: '',
                joined_groups: ''
            }
        };
        const mergedMetadata = {
            ...defaultMetadata,
            ...(targetProfile.metadata || {}),
            facebook: {
                ...defaultMetadata.facebook,
                ...((targetProfile.metadata || {}).facebook || {})
            }
        };
        return {
            name: targetProfile.name || '',
            username: targetProfile.username || '',
            email: targetProfile.email || '',
            phone: targetProfile.phone || '',
            birthday: parseServerDate(targetProfile.birthday),
            gender: targetProfile.gender || '',
            pronouns: targetProfile.pronouns || '',
            avatar_url: targetProfile.avatar_url || '',
            cover_url: targetProfile.cover_url || '',
            bio: targetProfile.bio || '',
            college: targetProfile.college || '',
            highschool: targetProfile.highschool || '',
            hometown: targetProfile.hometown || '',
            website: targetProfile.website || '',
            hobby: targetProfile.hobby || '',
            talent: targetProfile.talent || '',
            married_date: parseServerDate(targetProfile.married_date),
            license_plate: targetProfile.license_plate || '',
            is_verified: targetProfile.is_verified || false,
            is_admin: targetProfile.is_admin || false,
            is_confidential: targetProfile.is_confidential || false,
            metadata: mergedMetadata
        };
    });

    const [initialFormData] = useState<any>(() => JSON.parse(JSON.stringify(formData)));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isAdmin = !!myProfile?.is_admin;

    const hasChanges = useMemo(() => {
        if (!formData || !initialFormData) return false;
        return !isDeepEqual(formData, initialFormData);
    }, [formData, initialFormData]);

    const setField = useCallback((path: string, value: any) => {
        setFormData((prev: any) => {
            if (!prev) return prev;
            const next = { ...prev };
            const keys = path.split('.');
            let current = next;
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!current[k] || typeof current[k] !== 'object') {
                    current[k] = {};
                } else {
                    current[k] = { ...current[k] };
                }
                current = current[k];
            }
            current[keys[keys.length - 1]] = value;
            return next;
        });
    }, []);

    const handleSave = useCallback(() => {
        if (!formData) return;
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Full name is required';
        }
        if (!formData.username?.trim()) {
            newErrors.username = 'Username is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            Alert.alert('Validation Error', 'Please fill in all required fields.');
            return;
        }

        setErrors({});
        Keyboard.dismiss();

        const payload = {
            ...formData,
            birthday: formatToServerDate(formData.birthday),
            married_date: formatToServerDate(formData.married_date),
        };

        if (!isAdmin) {
            delete payload.is_verified;
            delete payload.is_admin;
            delete payload.is_confidential;
        }

        updateProfile({
            id: targetProfile?.id || 'me',
            data: payload
        }, {
            onSuccess: () => {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            },
            onError: () => {
                Alert.alert('Error', 'Failed to save changes. Please try again.');
            }
        });
    }, [formData, targetProfile, updateProfile, router, isAdmin]);

    const contextValue = useMemo(() => ({
        formData,
        setField,
        errors,
        colors,
        common,
        theme,
        t: (key: string) => key,
        isAdmin,
    }), [formData, setField, errors, colors, common, theme, isAdmin]);

    return (
        <FormContext.Provider value={contextValue}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={{
                    paddingTop: insets.top + 12,
                    paddingBottom: 8,
                    paddingHorizontal: 16,
                    backgroundColor: colors.background,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{
                                backgroundColor: colors.containerContent,
                                borderRadius: 999,
                                width: 40,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                        <View>
                            <FlexText style={[common.heading, { fontSize: 24 }]}>Edit Profile</FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 1 }]}>Update your personal info</FlexText>
                        </View>
                    </View>

                    {/* Right: Save button */}
                    {hasChanges && (
                        <Button
                            variant="primary"
                            onPress={handleSave}
                            isDisabled={isSaving}
                            style={{ height: 36, paddingHorizontal: 18, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
                        >
                            {isSaving ? (
                                <Spinner color="#ffffff" size="sm" />
                            ) : (
                                <Button.Label style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Save</Button.Label>
                            )}
                        </Button>
                    )}
                </View>

                <Tab.Navigator
                    sceneContainerStyle={{ backgroundColor: colors.background }}
                    style={{ backgroundColor: colors.background }}
                    tabBar={(props: any) => {
                        const { state, navigation, descriptors } = props;
                        const { routes, index } = state;
                        return (
                            <Tabs
                                value={routes[index].key}
                                onValueChange={(val: string) => {
                                    navigation.navigate(routes.find((r: any) => r.key === val)?.name);
                                }}
                                style={{ paddingHorizontal: 8 }}
                            >
                                <Tabs.List>
                                    <Tabs.ScrollView scrollAlign="center">
                                        <Tabs.Indicator />
                                        {routes.map((route: any) => {
                                            const label = descriptors[route.key]?.options?.tabBarLabel ?? route.name;
                                            return (
                                                <Tabs.Trigger key={route.key} value={route.key}>
                                                    <Tabs.Label>{label}</Tabs.Label>
                                                </Tabs.Trigger>
                                            );
                                        })}
                                    </Tabs.ScrollView>
                                </Tabs.List>
                            </Tabs>
                        );
                    }}
                >
                    <Tab.Screen name="General" component={BasicTab} />
                    <Tab.Screen name="Media" component={MediaTab} />
                    <Tab.Screen name="About" component={AboutTab} />
                    <Tab.Screen name="Physical" component={DetailsTab} options={{ tabBarLabel: 'Physical' }} />
                    <Tab.Screen name="Facebook" component={FacebookAdminTab} options={{ tabBarLabel: isAdmin ? 'System / FB' : 'Facebook' }} />
                </Tab.Navigator>
            </View>
        </FormContext.Provider>
    );
};

const EditProfileScreen = () => {
    const params = useLocalSearchParams();
    const targetId = (params.id as string) || 'me';
    const { colors } = useThemeContext();
    const { data: myProfile } = useProfile('me', true);
    const { data: targetProfile, isLoading: isProfileLoading } = useProfile(targetId, targetId === 'me');

    if (isProfileLoading || !targetProfile || !myProfile) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Spinner size="lg" color={colors.secondary} />
            </View>
        );
    }

    return <EditProfileForm targetProfile={targetProfile} myProfile={myProfile} />;
};

// ============================================================================
// Styles
// ============================================================================

const formStyles = StyleSheet.create({
    headerBar: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    tabScroll: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
        paddingBottom: 40,
    },
    fieldGroup: {
        marginBottom: 20,
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
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
});

export default EditProfileScreen;