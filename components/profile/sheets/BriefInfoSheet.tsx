import { FlexText } from "@/components/FlexText";
import { calculateBMI, enrichProfileData, getBMIStatus } from "@/utils/zodiacCalculation";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import CalendarIcon from "@/assets/images/svg/calendar-1.svg";
import LetterIcon from "@/assets/images/svg/mail.svg";
import MenIcon from "@/assets/images/svg/gender-male.svg";
import WomenIcon from "@/assets/images/svg/gender-female.svg";
import MobileIcon from "@/assets/images/svg/mobile.svg";
import LocationIcon from "@/assets/images/svg/location.svg";
import EducationIcon from "@/assets/images/svg/education.svg";
import MeasurementIcon from "@/assets/images/svg/measurement.svg";
import VehicleIcon from "@/assets/images/svg/vehicle.svg";
import CatIcon from "@/assets/images/svg/cat.svg";
import TimeIcon from "@/assets/images/svg/time.svg";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { Image } from "expo-image";
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from "../../../context/ThemeContext";
import { createCommonStyles } from "../../../styles/common";
import { ProfileDetail } from "../../../types/profiledetail";
import { Workplace } from "../../../types/profileworplace";
import { getFamilyAvatarSource } from "../../../utils/familyAvatar";
import { useSheetBackHandler } from "./useSheetBackHandler";

const Calendar = ({ size, ...props }: any) => <CalendarIcon width={size} height={size} {...props} />;
const Letter = ({ size, ...props }: any) => <LetterIcon width={size} height={size} {...props} />;
const Men = ({ size, ...props }: any) => <MenIcon width={size} height={size} {...props} />;
const Women = ({ size, ...props }: any) => <WomenIcon width={size} height={size} {...props} />;
const Phone = ({ size, ...props }: any) => <MobileIcon width={size} height={size} {...props} />;
const PointOnMap = ({ size, ...props }: any) => <LocationIcon width={size} height={size} {...props} />;
const SquareAcademicCap = ({ size, ...props }: any) => <EducationIcon width={size} height={size} {...props} />;
const NotebookBookmark = ({ size, ...props }: any) => <Ionicons name="book" size={size} {...props} />;
const Weigher = ({ size, ...props }: any) => <MeasurementIcon width={size} height={size} {...props} />;
const Wheel = ({ size, ...props }: any) => <VehicleIcon width={size} height={size} {...props} />;
const Cat = ({ size, ...props }: any) => <CatIcon width={size} height={size} {...props} />;
const History = ({ size, ...props }: any) => <TimeIcon width={size} height={size} {...props} />;
const CaseMinimalistic = ({ size, ...props }: any) => <Ionicons name="briefcase" size={size} {...props} />;
const ClipboardHeart = ({ size, ...props }: any) => <Ionicons name="heart-half" size={size} {...props} />;
const StarsMinimalistic = ({ size, ...props }: any) => <Ionicons name="sparkles" size={size} {...props} />;
const Calculator = ({ size, ...props }: any) => <Ionicons name="calculator" size={size} {...props} />;
const DumbbellLargeMinimalistic = ({ size, ...props }: any) => <Ionicons name="barbell" size={size} {...props} />;

interface BriefInfoSheetProps {
    profile?: ProfileDetail | null;
    workplaces?: Workplace[];
    homeInfo?: string | null;
}

export interface BriefInfoSheetHandle {
    present: () => void;
    dismiss: () => void;
}

type InfoItem =
    | { kind: 'solar'; icon: any; label: string; sublabel?: string }
    | { kind: 'ionicons'; name: string; label: string; sublabel?: string }
    | { kind: 'material'; name: string; label: string; sublabel?: string }
    | { kind: 'image'; source: any; label: string; sublabel?: string }
    | { kind: 'bank'; logo?: string; label: string; sublabel?: string };

interface Section {
    title: string;
    items: InfoItem[];
}

const InfoRow = memo(({ item, colors }: { item: InfoItem; colors: any }) => {
    const iconBg = (colors.primary || colors.text) + '15';

    const renderIcon = () => {
        switch (item.kind) {
            case 'solar':
                return <item.icon size={22} color={colors.primary || colors.text} />;
            case 'ionicons':
                return <Ionicons name={item.name as any} size={22} color={colors.primary || colors.text} />;
            case 'material':
                return <MaterialIcons name={item.name as any} size={22} color={colors.primary || colors.text} />;
            case 'image':
                return <Image source={item.source} style={styles.rowImage} resizeMode="cover" />;
            case 'bank':
                return item.logo
                    ? <Image source={{ uri: item.logo }} style={{ width: 28, height: 28 }} contentFit="contain" />
                    : <Ionicons name="card-outline" size={22} color={colors.primary || colors.text} />;
        }
    };

    const isImageKind = item.kind === 'image';

    return (
        <View style={styles.infoRow}>
            <View style={[
                styles.iconContainer,
                { backgroundColor: isImageKind ? colors.card : iconBg, overflow: 'hidden' }
            ]}>
                {renderIcon()}
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <FlexText style={[styles.infoLabel, { color: colors.text }]} numberOfLines={2}>
                    {item.label}
                </FlexText>
                {item.sublabel ? (
                    <FlexText style={[styles.infoSublabel, { color: colors.muted }]} numberOfLines={1}>
                        {item.sublabel}
                    </FlexText>
                ) : null}
            </View>
        </View>
    );
});

InfoRow.displayName = 'InfoRow';

export const BriefInfoSheet = memo(forwardRef<BriefInfoSheetHandle, BriefInfoSheetProps>(({ profile, workplaces = [], homeInfo }, ref) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const inset = useSafeAreaInsets();

    const [index, setIndex] = useState(0);
    const wasOpenRef = useRef(false);

    const controllerRef = useRef<BriefInfoSheetHandle>({
        present: () => {
            wasOpenRef.current = true;
            setIndex(1);
        },
        dismiss: () => {
            setIndex(0);
        }
    });

    useImperativeHandle(ref, () => ({
        present: () => controllerRef.current.present(),
        dismiss: () => controllerRef.current.dismiss(),
    }), []);

    const { onDidPresent, onDidDismiss } = useSheetBackHandler(controllerRef as any);

    useEffect(() => {
        if (index > 0) {
            onDidPresent();
        } else {
            onDidDismiss();
        }
    }, [index, onDidPresent, onDidDismiss]);

    const handleIndexChange = useCallback((newIndex: number) => {
        if (newIndex > 0) {
            wasOpenRef.current = true;
        }
        setIndex(newIndex);
    }, []);

    const handleSettle = useCallback((settledIndex: number) => {
        if (settledIndex === 0 && wasOpenRef.current) {
            wasOpenRef.current = false;
        }
    }, []);

    const metadata = profile?.metadata;
    const parsedMetadata = useMemo(() => {
        if (!metadata) return null;
        try {
            return typeof metadata === 'string'
                ? JSON.parse(metadata)
                : metadata;
        } catch {
            return null;
        }
    }, [metadata]);

    const height = parsedMetadata?.height;
    const weight = parsedMetadata?.weight;
    const bankinfo = parsedMetadata?.banking;
    const [profileInfo, setProfileInfo] = useState<Awaited<ReturnType<typeof enrichProfileData>>>(null);
    const BMI = useMemo(() => calculateBMI(height || 0, weight || 0), [height, weight]);
    const BMIStatus = useMemo(() => getBMIStatus(BMI), [BMI]);

    useEffect(() => {
        let cancelled = false;

        const birthday = profile?.birthday;
        if (!birthday) {
            Promise.resolve().then(() => {
                if (!cancelled) setProfileInfo(null);
            });
            return;
        }

        enrichProfileData(birthday)
            .then((res) => {
                if (!cancelled) setProfileInfo(res);
            })
            .catch(() => {
                if (!cancelled) setProfileInfo(null);
            });

        return () => {
            cancelled = true;
        };
    }, [profile?.birthday]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const sections = useMemo<Section[]>(() => {
        const result: Section[] = [];

        // Work
        if (workplaces.length > 0) {
            result.push({
                title: t('profile.briefInfo.sections.work'),
                items: workplaces.map(w => ({
                    kind: 'solar' as const,
                    icon: CaseMinimalistic,
                    label: t('profile.briefInfo.workAt', { position: w.position, company: w.company_name }),
                })),
            });
        }

        // Education
        const eduItems: InfoItem[] = [];
        if (profile?.college) eduItems.push({ kind: 'solar', icon: SquareAcademicCap, label: profile.college, sublabel: t('profile.info.fields.college') });
        if (profile?.highschool) eduItems.push({ kind: 'solar', icon: NotebookBookmark, label: profile.highschool, sublabel: t('profile.info.fields.highSchool') });
        if (eduItems.length > 0) result.push({ title: t('profile.briefInfo.sections.education'), items: eduItems });

        // Places
        if (homeInfo) {
            result.push({
                title: t('profile.briefInfo.sections.placesLived'),
                items: [{ kind: 'solar', icon: PointOnMap, label: homeInfo, sublabel: t('profile.info.fields.hometown') }],
            });
        }

        // Personal
        const personalItems: InfoItem[] = [];
        const birthdayStr = formatDate(profile?.birthday);
        if (birthdayStr) personalItems.push({
            kind: 'solar',
            icon: Calendar,
            label: birthdayStr,
            sublabel: t('profile.sheets.brief.personalLived', {
                days: String(profileInfo?.daysLived ?? 0),
                moonPhase: profileInfo?.moonPhase
                    ? t(`profile.sheets.brief.moonPhaseValue.${profileInfo.moonPhase}` as const)
                    : '',
            }),
        });
        if (profile?.gender) {
            const genderKey = profile.gender.toLowerCase() === 'male'
                ? 'male'
                : profile.gender.toLowerCase() === 'female'
                    ? 'female'
                    : 'other';
            personalItems.push({
                kind: 'solar',
                icon: profile.gender === 'male' ? Men : Women,
                label: t(`profile.sheets.brief.gender.${genderKey}` as const),
                sublabel: t('profile.info.fields.gender'),
            });
        }
        if (height) personalItems.push({ kind: 'material', name: 'height', label: `${height} cm`, sublabel: t('profile.info.fields.height') });
        if (weight) personalItems.push({ kind: 'solar', icon: Weigher, label: `${weight} kg`, sublabel: t('profile.info.fields.weight') });
        if (height && weight) personalItems.push({ kind: 'solar', icon: ClipboardHeart, label: `${BMI} BMI`, sublabel: t(`profile.sheets.brief.bmiStatusValue.${BMIStatus}` as const) });
        if (profileInfo?.zodiacSign) personalItems.push({ kind: 'solar', icon: StarsMinimalistic, label: t(`profile.sheets.brief.zodiacValue.${profileInfo.zodiacSign}` as const), sublabel: t('profile.sheets.brief.zodiacSign') });
        if (profileInfo?.chineseZodiac) personalItems.push({ kind: 'solar', icon: Cat, label: t(`profile.sheets.brief.chineseZodiacValue.${profileInfo.chineseZodiac}` as const), sublabel: t('profile.sheets.brief.chineseZodiac') });
        if (profileInfo?.lifePathNumber) personalItems.push({ kind: 'solar', icon: Calculator, label: profileInfo.lifePathNumber.toString(), sublabel: t('profile.sheets.brief.lifePathNumber') });
        if (profileInfo?.generation) personalItems.push({ kind: 'solar', icon: DumbbellLargeMinimalistic, label: t(`profile.sheets.brief.generationValue.${profileInfo.generation}` as const), sublabel: t('profile.sheets.brief.generation') });
        if (profileInfo?.historicalEvent) personalItems.push({ kind: 'solar', icon: History, label: profileInfo.historicalEvent, sublabel: t('profile.sheets.brief.historicalEventOnBirthday') });
        if (personalItems.length > 0) result.push({ title: t('profile.sheets.brief.sections.personal'), items: personalItems });
        // Contact
        const contactItems: InfoItem[] = [];
        if (profile?.email) contactItems.push({ kind: 'solar', icon: Letter, label: profile.email, sublabel: t('profile.info.fields.email') });
        if (profile?.phone) contactItems.push({ kind: 'solar', icon: Phone, label: profile.phone, sublabel: t('profile.info.fields.phone') });
        if (profile?.username) contactItems.push({ kind: 'ionicons', name: 'at-circle-outline', label: `@${profile.username}`, sublabel: t('profile.info.fields.username') });
        if (contactItems.length > 0) result.push({ title: t('profile.sheets.brief.sections.contact'), items: contactItems });

        // More
        const moreItems: InfoItem[] = [];
        if (profile?.hobby) moreItems.push({ kind: 'ionicons', name: 'extension-puzzle-outline', label: profile.hobby, sublabel: t('profile.info.fields.hobby') });
        if (profile?.talent) moreItems.push({ kind: 'ionicons', name: 'star-outline', label: profile.talent, sublabel: t('profile.info.fields.talent') });
        if (profile?.license_plate) moreItems.push({ kind: 'solar', icon: Wheel, label: profile.license_plate, sublabel: t('profile.info.fields.licensePlate') });
        const marriedStr = formatDate(profile?.married_date);
        if (marriedStr) moreItems.push({ kind: 'ionicons', name: 'heart-outline', label: t('profile.sheets.brief.marriedOn', { date: marriedStr }), sublabel: t('profile.info.fields.marriedDate') });
        if (moreItems.length > 0) result.push({ title: t('profile.sheets.brief.sections.more'), items: moreItems });

        // Banking
        if (bankinfo) {
            result.push({
                title: t('profile.sheets.brief.sections.banking'),
                items: [{
                    kind: 'bank',
                    logo: bankinfo.logo,
                    label: `${bankinfo.recipient} · ${bankinfo.banknumber}`,
                    sublabel: bankinfo.bankname,
                }],
            });
        }

        // Family
        if (profile?.loved_ones && profile.loved_ones.length > 0) {
            result.push({
                title: t('profile.sheets.brief.sections.family'),
                items: profile.loved_ones.map(person => ({
                    kind: 'image' as const,
                    source: getFamilyAvatarSource(person.label),
                    label: person.name,
                    sublabel: person.label,
                })),
            });
        }

        return result;
    }, [profile, workplaces, homeInfo, height, weight, bankinfo, profileInfo, t, BMI, BMIStatus]);

    return (
        <ModalBottomSheet
            index={index}
            onIndexChange={handleIndexChange}
            onSettle={handleSettle}
            detents={[0, 'content']}
            scrimColor={colors.scrim}
            scrimOpacities={[0, 0.5, 1]}
            extendUnderStatusBar
            surface={
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: colors.surfaceContainerLow,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            overflow: 'hidden',
                        },
                    ]}
                />
            }
        >
            <View style={[styles.grabber, { backgroundColor: colors.onSurfaceVariant, marginTop: inset.top + 12 }]} />
            <ScrollView nestedScrollEnabled style={{ flex: 1, paddingHorizontal: 12, paddingTop: 4 }}>

                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <FlexText style={[common.heading, { fontSize: 24 }]}>{t('profile.header.actions.knowMe')}</FlexText>
                    {profile?.name && (
                        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
                            {t('profile.sheets.brief.getToKnow', { name: profile.name })}
                        </FlexText>
                    )}
                </View>

                {/* Sections */}
                {sections.map((section) => (
                    <View key={section.title} style={{ marginBottom: 24 }}>
                        <FlexText style={[common.bodySmall, styles.sectionTitle]}>
                            {section.title}
                        </FlexText>
                        <View style={{ gap: 4 }}>
                            {section.items.map((item, i) => (
                                <InfoRow key={i} item={item} colors={colors} />
                            ))}
                        </View>
                    </View>
                ))}

                {sections.length === 0 && (
                    <FlexText style={[common.bodySmall, { color: colors.muted, textAlign: 'center' }]}>
                        {t('profile.sheets.brief.noInformation')}
                    </FlexText>
                )}

                <View style={{ height: inset.bottom + 20 }} />
            </ScrollView>
        </ModalBottomSheet>
    );
}));

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    rowImage: {
        width: 44,
        height: 44,
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    infoSublabel: {
        fontSize: 12,
        marginTop: 2,
    },
    sectionTitle: {
        fontWeight: '700',
        marginBottom: 12,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 11,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
});
