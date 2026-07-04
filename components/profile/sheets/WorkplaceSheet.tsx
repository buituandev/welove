import { FlexText } from '@/components/FlexText';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import dayjs from 'dayjs';
import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { Workplace } from '../../../types/profileworplace';
import { useSheetBackHandler } from "./useSheetBackHandler";
import { Button } from "heroui-native/button";
import { Spinner } from "heroui-native/spinner";
import { useAddWorkplace, useUpdateWorkplace, useDeleteWorkplace } from '@/services/workplace';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { parseServerDate, formatToServerDate } from '@/utils/date';

// ============================================================================
// Props & Helpers
// ============================================================================

interface WorkplaceSheetProps {
    data: Workplace[];
    profileId?: string;       // Required for mutations
    isOwner?: boolean;        // Show edit controls for owner
    onEndReached?: () => void;
}

const formatDate = (date: string) => {
    return dayjs(date).format('MMM YYYY');
};



const calculateDuration = (startDate: string, endDate: string | null, t: any) => {
    const start = dayjs(startDate);
    const end = endDate ? dayjs(endDate) : dayjs();

    const totalMonths = end.diff(start, 'month');
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(t('profile.sheets.work.durationYears', { count: years }) || `${years} yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(t('profile.sheets.work.durationMonths', { count: months }) || `${months} mo${months > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' ') : t('profile.sheets.work.durationLessThanMonth') || '< 1 mo';
};

// ============================================================================
// Workplace Item Component
// ============================================================================

const WorkplaceItem = memo(({
    item,
    colors,
    common,
    isOwner,
    onEdit,
    onDelete
}: {
    item: Workplace;
    colors: any;
    common: any;
    isOwner?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}) => {
    const { t } = useTranslation();
    const isCurrent = !item.end_date;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.card,
                borderColor: colors.border || 'transparent'
            }
        ]}>
            {/* Header: Icon + Company + Role + Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={[styles.iconContainer, { backgroundColor: (colors.primary || colors.text) + '15' }]}>
                    <Ionicons name="briefcase" size={20} color={colors.primary || colors.text} />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                    <FlexText style={[common.heading, { fontSize: 16 }]}>{item.company_name}</FlexText>
                    <FlexText style={[common.body, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>
                        {item.position}
                    </FlexText>
                </View>

                {isOwner && (
                    <View style={styles.actionButtons}>
                        {onEdit && (
                            <TouchableOpacity
                                onPress={onEdit}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <Ionicons name="pencil-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity
                                onPress={onDelete}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.actionButton}
                            >
                                <Ionicons name="trash-outline" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Metadata Row (Dates, Duration, Location) */}
            <View style={[styles.metaContainer, { backgroundColor: colors.background }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                        {formatDate(item.start_date)} - <Text style={{ color: isCurrent ? (colors.primary) : colors.muted, fontWeight: isCurrent ? '700' : '400' }}>{item.end_date ? formatDate(item.end_date) : t('profile.sheets.work.present', 'Present')}</Text>
                    </FlexText>

                    <FlexText style={[common.muted, { marginHorizontal: 6 }]}>•</FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                        {calculateDuration(item.start_date, item.end_date, t)}
                    </FlexText>
                </View>

                {item.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ionicons name="location-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{item.location}</FlexText>
                    </View>
                )}
            </View>

            {/* Description */}
            {item.description && (
                <View style={{ marginTop: 12 }}>
                    <FlexText style={[common.body, { fontSize: 14, lineHeight: 22, opacity: 0.8 }]}>
                        {item.description}
                    </FlexText>
                </View>
            )}
        </View>
    );
});

WorkplaceItem.displayName = 'WorkplaceItem';

// ============================================================================
// Add / Edit Workplace Stacked Sheet
// ============================================================================

interface AddEditWorkplaceSheetProps {
    profileId: string;
    onSuccess: () => void;
}

const AddEditWorkplaceSheet = memo(
    forwardRef<TrueSheet, AddEditWorkplaceSheetProps>(({ profileId, onSuccess }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const [workplaceToEdit, setWorkplaceToEdit] = useState<Workplace | null>(null);
        const [companyName, setCompanyName] = useState('');
        const [position, setPosition] = useState('');
        const [location, setLocation] = useState('');
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [description, setDescription] = useState('');
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [showStartPicker, setShowStartPicker] = useState(false);
        const [showEndPicker, setShowEndPicker] = useState(false);

        const { mutate: addWorkplace, isPending: isAdding } = useAddWorkplace(profileId);
        const { mutate: updateWorkplace, isPending: isUpdating } = useUpdateWorkplace(profileId);
        const isSaving = isAdding || isUpdating;

        useImperativeHandle(ref, () => ({
            present: (editingWorkplace?: Workplace) => {
                if (isPresented.current) return Promise.resolve();
                isPresented.current = true;

                if (editingWorkplace) {
                    setWorkplaceToEdit(editingWorkplace);
                    setCompanyName(editingWorkplace.company_name || '');
                    setPosition(editingWorkplace.position || '');
                    setLocation(editingWorkplace.location || '');
                    setStartDate(parseServerDate(editingWorkplace.start_date));
                    setEndDate(parseServerDate(editingWorkplace.end_date));
                    setDescription(editingWorkplace.description || '');
                } else {
                    setWorkplaceToEdit(null);
                    setCompanyName('');
                    setPosition('');
                    setLocation('');
                    setStartDate(dayjs().format('YYYY-MM-DD'));
                    setEndDate('');
                    setDescription('');
                }
                setErrors({});
                setShowStartPicker(false);
                setShowEndPicker(false);
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

            if (!companyName.trim()) {
                newErrors.companyName = t('profile.sheets.work.companyRequired', 'Company name is required');
            }
            if (!position.trim()) {
                newErrors.position = t('profile.sheets.work.positionRequired', 'Position is required');
            }
            if (!location.trim()) {
                newErrors.location = t('profile.sheets.work.locationRequired', 'Location is required');
            }
            if (!startDate.trim()) {
                newErrors.startDate = t('profile.sheets.work.startDateRequired', 'Start date is required');
            } else if (!dayjs(startDate.trim()).isValid()) {
                newErrors.startDate = t('profile.sheets.work.invalidStartDate', 'Please enter a valid date (YYYY-MM-DD)');
            }

            if (endDate.trim() && !dayjs(endDate.trim()).isValid()) {
                newErrors.endDate = t('profile.sheets.work.invalidEndDate', 'Please enter a valid date (YYYY-MM-DD)');
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({});
            Keyboard.dismiss();

            const payload = {
                company_name: companyName.trim(),
                position: position.trim(),
                location: location.trim(),
                start_date: formatToServerDate(startDate.trim()),
                end_date: formatToServerDate(endDate.trim()),
                description: description.trim() || null,
            };

            const done = () => {
                onSuccess();
                sheetRef.current?.dismiss();
            };

            if (workplaceToEdit) {
                updateWorkplace({
                    workplaceId: workplaceToEdit.id,
                    ...payload,
                }, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.work.errorTitle', 'Error'),
                            t('profile.sheets.work.updateError', 'Failed to update workplace')
                        );
                    }
                });
            } else {
                addWorkplace(payload, {
                    onSuccess: done,
                    onError: () => {
                        Alert.alert(
                            t('profile.sheets.work.errorTitle', 'Error'),
                            t('profile.sheets.work.addError', 'Failed to add workplace')
                        );
                    }
                });
            }
        }, [companyName, position, location, startDate, endDate, description, workplaceToEdit, addWorkplace, updateWorkplace, onSuccess, t]);

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
                                {workplaceToEdit ? t('profile.sheets.work.editTitle', 'Edit Workplace') : t('profile.sheets.work.addTitle', 'Add Workplace')}
                            </FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                                {t('profile.sheets.work.addSubtitle', 'Enter your work experience details below')}
                            </FlexText>
                        </View>
                    </View>

                    {/* Company Name Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.companyLabel', 'Company Name')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.companyName ? '#ff4444' : 'transparent',
                                borderWidth: errors.companyName ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="business-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="e.g. Google, Inc."
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {companyName.length > 0 && (
                                <TouchableOpacity onPress={() => setCompanyName("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.companyName && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.companyName}
                            </FlexText>
                        )}
                    </View>

                    {/* Position / Role Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.positionLabel', 'Position / Title')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.position ? '#ff4444' : 'transparent',
                                borderWidth: errors.position ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="bookmark-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={position}
                                onChangeText={setPosition}
                                placeholder="e.g. Senior Software Engineer"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {position.length > 0 && (
                                <TouchableOpacity onPress={() => setPosition("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.position && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.position}
                            </FlexText>
                        )}
                    </View>

                    {/* Location Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.locationLabel', 'Location')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                borderColor: errors.location ? '#ff4444' : 'transparent',
                                borderWidth: errors.location ? 1 : 0,
                            }
                        ]}>
                            <Ionicons name="location-outline" size={18} color={colors.muted} />
                            <TextInput
                                value={location}
                                onChangeText={setLocation}
                                placeholder="e.g. Mountain View, CA"
                                placeholderTextColor={colors.muted}
                                style={[formStyles.textInput, { color: colors.text }]}
                                autoCorrect={false}
                            />
                            {location.length > 0 && (
                                <TouchableOpacity onPress={() => setLocation("")}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {errors.location && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.location}
                            </FlexText>
                        )}
                    </View>

                    {/* Start Date Picker */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.startDateLabel', 'Start Date')}
                        </FlexText>
                        <TouchableOpacity
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowStartPicker(!showStartPicker);
                                setShowEndPicker(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                                formStyles.inputContainer,
                                {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    borderColor: errors.startDate ? '#ff4444' : 'transparent',
                                    borderWidth: errors.startDate ? 1 : 0,
                                }
                            ]}
                        >
                            <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                            <View style={{ flex: 1, paddingLeft: 8 }}>
                                <FlexText style={{ color: startDate ? colors.text : colors.muted, fontSize: 16 }}>
                                    {startDate ? dayjs(startDate).format('MMMM DD, YYYY') : t('profile.sheets.work.startDatePlaceholder', 'Select start date')}
                                </FlexText>
                            </View>
                            {startDate.length > 0 && (
                                <TouchableOpacity onPress={(e) => {
                                    e.stopPropagation();
                                    setStartDate("");
                                }}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {showStartPicker && (
                            <View style={{ marginTop: 8, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 8, alignItems: 'center' }}>
                                <DateTimePicker
                                    value={(() => {
                                        if (!startDate) {
                                            const now = new Date();
                                            return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                                        }
                                        const [year, month, day] = startDate.split('-').map(Number);
                                        return new Date(Date.UTC(year, month - 1, day));
                                    })()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    presentation={Platform.OS === 'android' ? 'dialog' : undefined}
                                    onValueChange={(_event, date) => {
                                        setShowStartPicker(false);
                                        const year = date.getUTCFullYear();
                                        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                        const day = String(date.getUTCDate()).padStart(2, '0');
                                        setStartDate(`${year}-${month}-${day}`);
                                    }}
                                    onDismiss={() => {
                                        setShowStartPicker(false);
                                    }}
                                    themeVariant={theme}
                                />
                            </View>
                        )}

                        {errors.startDate && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.startDate}
                            </FlexText>
                        )}
                    </View>

                    {/* End Date Picker */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.endDateLabel', 'End Date')}
                        </FlexText>
                        <TouchableOpacity
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowEndPicker(!showEndPicker);
                                setShowStartPicker(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                                formStyles.inputContainer,
                                {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    borderColor: errors.endDate ? '#ff4444' : 'transparent',
                                    borderWidth: errors.endDate ? 1 : 0,
                                }
                            ]}
                        >
                            <Ionicons name="calendar-clear-outline" size={18} color={colors.muted} />
                            <View style={{ flex: 1, paddingLeft: 8 }}>
                                <FlexText style={{ color: endDate ? colors.text : colors.muted, fontSize: 16 }}>
                                    {endDate ? dayjs(endDate).format('MMMM DD, YYYY') : t('profile.sheets.work.endDatePlaceholder', 'Present (Currently working here)')}
                                </FlexText>
                            </View>
                            {endDate.length > 0 && (
                                <TouchableOpacity onPress={(e) => {
                                    e.stopPropagation();
                                    setEndDate("");
                                }}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        {showEndPicker && (
                            <View style={{ marginTop: 8, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 8, alignItems: 'center' }}>
                                <DateTimePicker
                                    value={(() => {
                                        if (!endDate) {
                                            const now = new Date();
                                            return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                                        }
                                        const [year, month, day] = endDate.split('-').map(Number);
                                        return new Date(Date.UTC(year, month - 1, day));
                                    })()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    presentation={Platform.OS === 'android' ? 'dialog' : undefined}
                                    onValueChange={(_event, date) => {
                                        setShowEndPicker(false);
                                        const year = date.getUTCFullYear();
                                        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                        const day = String(date.getUTCDate()).padStart(2, '0');
                                        setEndDate(`${year}-${month}-${day}`);
                                    }}
                                    onDismiss={() => {
                                        setShowEndPicker(false);
                                    }}
                                    themeVariant={theme}
                                />
                            </View>
                        )}

                        {errors.endDate && (
                            <FlexText style={[common.bodySmall, { color: '#ff4444', marginTop: 4, marginLeft: 8 }]}>
                                {errors.endDate}
                            </FlexText>
                        )}
                    </View>

                    {/* Description Input */}
                    <View style={formStyles.fieldGroup}>
                        <FlexText style={[common.bodySmall, formStyles.customLabel]}>
                            {t('profile.sheets.work.descriptionLabel', 'Description / Role Details (Optional)')}
                        </FlexText>
                        <View style={[
                            formStyles.inputContainer,
                            {
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                height: 80,
                                borderRadius: 16,
                                paddingVertical: 10,
                                alignItems: 'flex-start',
                            }
                        ]}>
                            <Ionicons name="document-text-outline" size={18} color={colors.muted} style={{ marginTop: 2 }} />
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="e.g. Developed and scaled microservices..."
                                placeholderTextColor={colors.muted}
                                multiline
                                numberOfLines={3}
                                style={[formStyles.textInput, { color: colors.text, height: '100%', textAlignVertical: 'top' }]}
                                autoCorrect={false}
                            />
                            {description.length > 0 && (
                                <TouchableOpacity onPress={() => setDescription("")} style={{ marginTop: 2 }}>
                                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
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
                                {workplaceToEdit ? t('profile.sheets.work.save', 'Save Changes') : t('profile.sheets.work.add', 'Add Workplace')}
                            </Button.Label>
                        )}
                    </Button>
                </ScrollView>
            </TrueSheet>
        );
    })
);

AddEditWorkplaceSheet.displayName = 'AddEditWorkplaceSheet';

// ============================================================================
// Main WorkplaceSheet Component
// ============================================================================

export const WorkplaceSheet = memo(forwardRef<TrueSheet, WorkplaceSheetProps>(
    ({ data, profileId, isOwner = false, onEndReached }, ref) => {
        const { colors, typography, theme } = useThemeContext();
        const common = createCommonStyles(colors, typography);
        const { t } = useTranslation();
        const inset = useSafeAreaInsets();

        const sheetRef = useRef<TrueSheet>(null);
        const isPresented = useRef(false);
        const backHandler = useSheetBackHandler(sheetRef);

        const addEditSheetRef = useRef<TrueSheet>(null);

        const { mutate: deleteWorkplace } = useDeleteWorkplace(profileId ?? '');

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

        const handleDelete = useCallback((workplaceId: string) => {
            Alert.alert(
                t('profile.sheets.work.deleteTitle', 'Delete Workplace'),
                t('profile.sheets.work.deleteMessage', 'Are you sure you want to remove this workplace experience?'),
                [
                    { text: t('profile.sheets.work.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('profile.sheets.work.delete', 'Delete'),
                        style: 'destructive',
                        onPress: () => {
                            deleteWorkplace(workplaceId);
                        },
                    },
                ]
            );
        }, [deleteWorkplace, t]);

        const handleOpenAddEditSheet = useCallback((editingWorkplace?: Workplace) => {
            (addEditSheetRef.current as any)?.present(editingWorkplace);
        }, []);

        if ((!data || data.length === 0) && !isOwner) return null;

        const listHeader = (
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>
                        {t('profile.sheets.work.title', 'Work History')}
                    </FlexText>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                        {t('profile.sheets.work.subtitle', 'Professional work history and experiences')}
                    </FlexText>
                </View>
                {isOwner && profileId && (
                    <TouchableOpacity
                        onPress={() => handleOpenAddEditSheet()}
                        style={[styles.addLinkButton, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="add" size={20} color={colors.text} />
                        <FlexText style={[common.bodySmall, { color: colors.text, marginLeft: 4, fontWeight: '600' }]}>
                            {t('profile.sheets.work.addWorkplace', 'Add')}
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
                                <Ionicons name="briefcase-outline" size={48} color={colors.muted} />
                                <FlexText style={[common.body, { color: colors.muted, marginTop: 12, textAlign: 'center' }]}>
                                    {t('profile.sheets.work.emptyList', 'No work history connected')}
                                </FlexText>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={{ paddingHorizontal: 24 }}>
                                <WorkplaceItem
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

                {/* Stacked Add/Edit Workplace Sheet */}
                {isOwner && profileId && (
                    <AddEditWorkplaceSheet
                        ref={addEditSheetRef}
                        profileId={profileId}
                        onSuccess={() => { }}
                    />
                )}
            </>
        );
    }
));

WorkplaceSheet.displayName = 'WorkplaceSheet';

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
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    metaContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 4,
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