import { FlexText } from '@/components/FlexText';
import { useAddAddress, useDeleteAddress, useUpdateAddress } from '@/services/address';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Button } from "heroui-native/button";
import { Spinner } from "heroui-native/spinner";
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Keyboard, Linking, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileAddress } from "../../../types/profileaddress";
import { useSheetBackHandler } from "./useSheetBackHandler";

// ============================================================================
// Props
// ============================================================================

interface AddressSheetProps {
    data: ProfileAddress[];
    profileId?: string;       // Required for add/edit/delete mutations
    isOwner?: boolean;        // Show edit controls only for profile owner
    onEndReached?: () => void;
}

// ============================================================================
// Address Item Component
// ============================================================================

const AddressItem = memo(({
    item,
    colors,
    common,
    isOwner,
    onEdit,
    onDelete
}: {
    item: ProfileAddress;
    colors: any;
    common: any;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}) => {
    const handleOpenMaps = useCallback(() => {
        const fullAddress = [item.street, item.city, item.state, item.country].filter(Boolean).join(', ');
        const encodedAddress = encodeURIComponent(fullAddress);

        const url = Platform.select({
            ios: `maps:0,0?q=${encodedAddress}`,
            android: `geo:0,0?q=${encodedAddress}`,
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    }, [item]);

    const addressHeader = [item.street, item.city, item.state, item.country].filter(Boolean).join(', ');

    return (
        <View style={styles.card}>
            <TouchableOpacity
                onPress={handleOpenMaps}
                activeOpacity={0.7}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
                <View style={[styles.iconContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                    <Ionicons
                        name="location"
                        size={24}
                        color={colors.primary || colors.text}
                    />
                </View>

                <View style={styles.textContainer}>
                    <FlexText style={[common.heading, { fontSize: 16 }]} numberOfLines={1}>
                        {item.label}
                    </FlexText>

                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                        {addressHeader} {item.postal_code}
                    </FlexText>
                </View>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    onPress={handleOpenMaps}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.actionButton}
                >
                    <Ionicons name="navigate-circle-outline" size={24} color={colors.muted} />
                </TouchableOpacity>

                {isOwner && onEdit && (
                    <TouchableOpacity
                        onPress={onEdit}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.actionButton}
                    >
                        <Ionicons name="pencil-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                )}

                {isOwner && onDelete && (
                    <TouchableOpacity
                        onPress={onDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={22} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

AddressItem.displayName = 'AddressItem';

// ============================================================================
// Add / Edit Address Stacked Sheet
// ============================================================================

interface AddEditAddressSheetProps {
    profileId: string;
    onSuccess: () => void;
}

const AddEditAddressSheet = memo(
    forwardRef<TrueSheet, AddEditAddressSheetProps>(({ profileId, onSuccess }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const [addressToEdit, setAddressToEdit] = useState<ProfileAddress | null>(null);
        const [label, setLabel] = useState('Home');
        const [street, setStreet] = useState('');
        const [city, setCity] = useState('');
        const [state, setState] = useState('');
        const [postalCode, setPostalCode] = useState('');
        const [country, setCountry] = useState('');
        const [errors, setErrors] = useState<Record<string, string>>({});

        const { mutate: addAddress, isPending: isAdding } = useAddAddress(profileId);
        const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress(profileId);
        const isSaving = isAdding || isUpdating;

        useImperativeHandle(ref, () => ({
            present: (editingAddress?: ProfileAddress) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;

                if (editingAddress) {
                    setAddressToEdit(editingAddress);
                    setLabel(editingAddress.label || '');
                    setStreet(editingAddress.street || '');
                    setCity(editingAddress.city || '');
                    setState(editingAddress.state || '');
                    setPostalCode(editingAddress.postal_code || '');
                    setCountry(editingAddress.country || '');
                } else {
                    setAddressToEdit(null);
                    setLabel('Home');
                    setStreet('');
                    setCity('');
                    setState('');
                    setPostalCode('');
                    setCountry('');
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

            if (!label.trim()) {
                newErrors.label = t('profile.sheets.address.labelRequired', 'Label is required');
            }
            if (!street.trim()) {
                newErrors.street = t('profile.sheets.address.streetRequired', 'Street address is required');
            }
            if (!city.trim()) {
                newErrors.city = t('profile.sheets.address.cityRequired', 'City is required');
            }
            if (!country.trim()) {
                newErrors.country = t('profile.sheets.address.countryRequired', 'Country is required');
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({});
            Keyboard.dismiss();

            const payload = {
                label: label.trim(),
                street: street.trim(),
                city: city.trim(),
                state: state.trim() || null,
                postal_code: postalCode.trim() || null,
                country: country.trim(),
            };

            const done = () => {
                onSuccess();
                sheetRef.current?.dismiss();
            };

            if (addressToEdit) {
                updateAddress({
                    addressId: addressToEdit.id,
                    ...payload,
                }, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.address.errorTitle', 'Error'),
                            t('profile.sheets.address.updateError', 'Failed to update address')
                        );
                    }
                });
            } else {
                addAddress(payload, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.address.errorTitle', 'Error'),
                            t('profile.sheets.address.addError', 'Failed to add address')
                        );
                    }
                });
            }
        }, [label, street, city, state, postalCode, country, addressToEdit, addAddress, updateAddress, onSuccess, t]);

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
                                {addressToEdit ? t('profile.sheets.address.editTitle', 'Edit Address') : t('profile.sheets.address.addTitle', 'Add Address')}
                            </FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                                {t('profile.sheets.address.addSubtitle', 'Enter your location details below')}
                            </FlexText>
                        </View>
                    </View>

                    {/* Label Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.labelField', 'Address Label')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.label ? '#ff4444' : 'transparent',
                                borderWidth: errors.label ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="bookmark-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={label}
                                onChangeText={setLabel}
                                placeholder="e.g. Home, Work, Beach House"
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
                        {errors.label && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.label}
                            </FlexText>
                        )}
                    </View>

                    {/* Street Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.streetField', 'Street Address')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.street ? '#ff4444' : 'transparent',
                                borderWidth: errors.street ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="business-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={street}
                                onChangeText={setStreet}
                                placeholder="e.g. 123 Main Street"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {street.length > 0 && (
                                <TouchableOpacity onPress={() => setStreet("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.street && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.street}
                            </FlexText>
                        )}
                    </View>

                    {/* City Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.cityField', 'City')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.city ? '#ff4444' : 'transparent',
                                borderWidth: errors.city ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="map-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={city}
                                onChangeText={setCity}
                                placeholder="e.g. San Francisco"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {city.length > 0 && (
                                <TouchableOpacity onPress={() => setCity("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.city && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.city}
                            </FlexText>
                        )}
                    </View>

                    {/* State / Province Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.stateField', 'State / Province (Optional)')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            }
                        ]}>
                            <Ionicons name="flag-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={state}
                                onChangeText={setState}
                                placeholder="e.g. California"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {state.length > 0 && (
                                <TouchableOpacity onPress={() => setState("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Postal Code Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.postalField', 'Postal Code (Optional)')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            }
                        ]}>
                            <Ionicons name="mail-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={postalCode}
                                onChangeText={setPostalCode}
                                placeholder="e.g. 94103"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {postalCode.length > 0 && (
                                <TouchableOpacity onPress={() => setPostalCode("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Country Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.address.countryField', 'Country')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.country ? '#ff4444' : 'transparent',
                                borderWidth: errors.country ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="earth-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={country}
                                onChangeText={setCountry}
                                placeholder="e.g. United States"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {country.length > 0 && (
                                <TouchableOpacity onPress={() => setCountry("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.country && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.country}
                            </FlexText>
                        )}
                    </View>

                    {/* Submit Button */}
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
                                {addressToEdit ? t('profile.sheets.address.save', 'Save Changes') : t('profile.sheets.address.add', 'Add Address')}
                            </Button.Label>
                        )}
                    </Button>
                </ScrollView>
            </TrueSheet>
        );
    })
);

AddEditAddressSheet.displayName = 'AddEditAddressSheet';

// ============================================================================
// Main AddressSheet Component
// ============================================================================

export const AddressSheet = memo(forwardRef<TrueSheet, AddressSheetProps>(
    ({ data, profileId, isOwner = false, onEndReached }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const inset = useSafeAreaInsets();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const addEditSheetRef = useRef<TrueSheet>(null);

        const { mutate: deleteAddress } = useDeleteAddress(profileId ?? '');

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

        const handleDelete = useCallback((addressId: string) => {
            Alert.alert(
                t('profile.sheets.address.deleteTitle', 'Delete Address'),
                t('profile.sheets.address.deleteMessage', 'Are you sure you want to remove this address?'),
                [
                    { text: t('profile.sheets.address.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('profile.sheets.address.delete', 'Delete'),
                        style: 'destructive',
                        onPress: () => {
                            deleteAddress(addressId);
                        },
                    },
                ]
            );
        }, [deleteAddress, t]);

        const handleOpenAddEditSheet = useCallback((editingAddress?: ProfileAddress) => {
            (addEditSheetRef.current as any)?.present(editingAddress);
        }, []);

        if ((!data || data.length === 0) && !isOwner) return null;

        const listHeader = (
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>
                        {t('profile.sheets.address.title', 'Addresses')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.address.subtitle', 'Manage and navigate to user locations')}
                    </FlexText>
                </View>
                {isOwner && profileId && (
                    <TouchableOpacity
                        onPress={() => handleOpenAddEditSheet()}
                        style={[styles.addLinkButton, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="add" size={20} color={colors.text} />
                        <FlexText style={[common.bodySmall, { color: colors.text, marginLeft: 4, fontWeight: '600' }]}>
                            {t('profile.sheets.address.addAddress', 'Add')}
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
                                <Ionicons name="location-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                                    {t('profile.sheets.address.emptyList', 'No addresses connected')}
                                </FlexText>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={{ paddingHorizontal: 24 }}>
                                <AddressItem
                                    item={item}
                                    colors={colors}
                                    common={common}
                                    isOwner={isOwner}
                                    onEdit={isOwner ? () => handleOpenAddEditSheet(item) : undefined}
                                    onDelete={isOwner ? () => handleDelete(item.id) : undefined}
                                />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 40 + inset.bottom }}
                    />
                </TrueSheet>

                {/* Stacked Add/Edit Address Sheet */}
                {isOwner && profileId && (
                    <AddEditAddressSheet
                        ref={addEditSheetRef}
                        profileId={profileId}
                        onSuccess={() => { }}
                    />
                )}
            </>
        );
    }
));

AddressSheet.displayName = 'AddressSheet';

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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
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