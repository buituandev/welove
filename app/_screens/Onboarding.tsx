import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import { createCommonStyles } from '@/styles/common';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { formatUTCDate, toUTCDate } from '@/utils/date';
import { Image as ExpoImage } from 'expo-image';
import { Spinner } from "heroui-native/spinner";
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useObserve } from 'expo-observe';
import { useOnboardingViewModel } from '../../viewmodels/OnboardingViewModel';

const OnboardingScreen = () => {
    const { colors, typography } = useThemeContext();
    const { t } = useTranslation();
    const { markInteractive } = useObserve();

    useEffect(() => {
        markInteractive();
    }, [markInteractive]);
    const common = createCommonStyles(colors, typography);
    const style = styles(colors);

    const { form, isSubmitting, submittingState, error, maxBirthday, setField, pickAvatar, handleSubmit } =
        useOnboardingViewModel();

    const nameRef = useRef<TextInput>(null);
    const bioRef = useRef<TextInput>(null);
    const [showAndroidPicker, setShowAndroidPicker] = useState(false);

    return (
        <SafeAreaView style={[style.container, { backgroundColor: colors.background }]}>
            <KeyboardAwareScrollView
                contentContainerStyle={style.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={24}
            >
                <View style={style.header}>
                    <FlexText style={[common.headline, { fontWeight: 'bold' }]}>
                        {t('onboarding.title')}
                    </FlexText>
                    <FlexText style={[common.body, { color: colors.muted, marginTop: 6 }]}>
                        {t('onboarding.subtitle')}
                    </FlexText>
                </View>

                {/* Avatar picker */}
                <TouchableOpacity style={style.avatarWrapper} onPress={pickAvatar} activeOpacity={0.8}>
                    {form.avatarUri ? (
                        <ExpoImage
                            source={{ uri: form.avatarUri }}
                            style={style.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[style.avatar, style.avatarPlaceholder, { backgroundColor: colors.containerContent }]}>
                            <FlexText style={[common.body, { color: colors.muted }]}>
                                {t('onboarding.avatar.placeholder')}
                            </FlexText>
                        </View>
                    )}
                    <View style={[style.avatarEditBadge, { backgroundColor: colors.secondary }]}>
                        <FlexText style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                            {t('onboarding.avatar.edit')}
                        </FlexText>
                    </View>
                </TouchableOpacity>

                {/* Name */}
                <View style={style.fieldGroup}>
                    <FlexText style={[common.label, { marginBottom: 6 }]}>
                        {t('onboarding.name.label')}
                    </FlexText>
                    <TextInput
                        ref={nameRef}
                        style={[style.input, { color: colors.text, backgroundColor: colors.containerContent }]}
                        placeholder={t('onboarding.name.placeholder')}
                        placeholderTextColor={colors.muted}
                        value={form.name}
                        onChangeText={(v) => setField('name', v)}
                        returnKeyType="next"
                        onSubmitEditing={() => bioRef.current?.focus()}
                        maxLength={60}
                    />
                </View>

                {/* Birthday — native date picker */}
                <View style={style.fieldGroup}>
                    <FlexText style={[common.label, { marginBottom: 6 }]}>
                        {t('onboarding.birthday.label')}
                    </FlexText>
                    {Platform.OS === 'ios' ? (
                        // iOS: compact label that expands to an inline calendar on tap
                        <DateTimePicker
                            value={form.birthday ?? maxBirthday}
                            mode="date"
                            display="compact"
                            maximumDate={maxBirthday}
                            onValueChange={(_event, date) => {
                                setField('birthday', toUTCDate(date));
                            }}
                            themeVariant={colors.background === '#ffffff' ? 'light' : 'dark'}
                            style={{ alignSelf: 'flex-start', marginLeft: -8 }}
                        />
                    ) : (
                        // Android: tappable field that opens a modal calendar dialog
                        <>
                            <TouchableOpacity
                                style={[style.input, style.dateButton, { backgroundColor: colors.containerContent }]}
                                onPress={() => setShowAndroidPicker(true)}
                                activeOpacity={0.7}
                            >
                                <FlexText style={{ color: form.birthday ? colors.text : colors.muted }}>
                                    {form.birthday
                                        ? formatUTCDate(form.birthday)
                                        : t('onboarding.birthday.placeholder')}
                                </FlexText>
                            </TouchableOpacity>
                            {showAndroidPicker && (
                                <DateTimePicker
                                    value={form.birthday ?? maxBirthday}
                                    mode="date"
                                    display="default"
                                    maximumDate={maxBirthday}
                                    onValueChange={(_event, date) => {
                                        setShowAndroidPicker(false);
                                        setField('birthday', toUTCDate(date));
                                    }}
                                    onDismiss={() => setShowAndroidPicker(false)}
                                />
                            )}
                        </>
                    )}
                    <FlexText style={[common.caption, { color: colors.muted, marginTop: 4 }]}>
                        {t('onboarding.birthday.requirement')}
                    </FlexText>
                </View>

                {/* Bio */}
                <View style={style.fieldGroup}>
                    <FlexText style={[common.label, { marginBottom: 6 }]}>
                        {t('onboarding.bio.label')}
                    </FlexText>
                    <TextInput
                        ref={bioRef}
                        style={[
                            style.input,
                            style.bioInput,
                            { color: colors.text, backgroundColor: colors.containerContent },
                        ]}
                        placeholder={t('onboarding.bio.placeholder')}
                        placeholderTextColor={colors.muted}
                        value={form.bio}
                        onChangeText={(v) => setField('bio', v)}
                        multiline
                        maxLength={160}
                        returnKeyType="done"
                    />
                    <FlexText style={[common.caption, { color: colors.muted, marginTop: 4, textAlign: 'right' }]}>
                        {form.bio.length}
                        {t('onboarding.bio.counterSuffix')}
                    </FlexText>
                </View>

                {/* Error */}
                {error ? (
                    <View style={[style.errorBox, { backgroundColor: '#FEE2E2' }]}>
                        <FlexText style={[common.bodySmall, { color: '#B91C1C' }]}>{error}</FlexText>
                    </View>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                    style={[
                        common.button,
                        style.submitButton,
                        { backgroundColor: colors.secondary, opacity: isSubmitting ? 0.6 : 1 },
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                >
                    {isSubmitting ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Spinner size="md" color="#fff" />
                            <FlexText style={[common.buttonText, { color: '#fff', fontWeight: 'bold' }]}>
                                {submittingState === 'creating' && t('onboarding.submitting.creating', 'Creating Profile...')}
                                {submittingState === 'uploading' && t('onboarding.submitting.uploading', 'Uploading Avatar...')}
                                {submittingState === 'saving' && t('onboarding.submitting.saving', 'Saving Avatar...')}
                            </FlexText>
                        </View>
                    ) : (
                        <FlexText style={[common.buttonText, { color: '#fff', fontWeight: 'bold' }]}>
                            {t('onboarding.submit')}
                        </FlexText>
                    )}
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default OnboardingScreen;

const styles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scroll: {
            paddingHorizontal: 24,
            paddingBottom: 40,
        },
        header: {
            paddingTop: 24,
            paddingBottom: 28,
        },
        avatarWrapper: {
            alignSelf: 'center',
            marginBottom: 32,
        },
        avatar: {
            width: 96,
            height: 96,
            borderRadius: 48,
        },
        avatarPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.divider,
            borderStyle: 'dashed',
        },
        avatarEditBadge: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
        },
        fieldGroup: {
            marginBottom: 20,
        },
        input: {
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            fontSize: 15,
        },
        dateButton: {
            justifyContent: 'center',
        },
        bioInput: {
            minHeight: 90,
            textAlignVertical: 'top',
        },
        errorBox: {
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
        },
        submitButton: {
            marginTop: 8,
            borderRadius: 9999,
            paddingVertical: 14,
        },
    });
