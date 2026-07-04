import Ionicons from "@react-native-vector-icons/ionicons/static";
import EducationIcon from "@/assets/images/svg/education.svg";
import LocationIcon from "@/assets/images/svg/location.svg";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileDetail } from "../../types/profiledetail";
import { Workplace } from "../../types/profileworplace";
import { FlexText } from '../FlexText';

const CaseMinimalistic = ({ size, ...props }: any) => <Ionicons name="briefcase" size={size} {...props} />;
const NotebookBookmark = ({ size, ...props }: any) => <Ionicons name="book" size={size} {...props} />;
const SquareAcademicCap = ({ size, ...props }: any) => <EducationIcon width={size} height={size} {...props} />;
const PointOnMap = ({ size, ...props }: any) => <LocationIcon width={size} height={size} {...props} />;

interface ProfileBriefInfoProps {
    profile?: ProfileDetail | null;
    workplaces?: Workplace[];
    homeInfo?: string | null;
}

interface SectionProps {
    title: string;
    items: any[];
    colors: any;
    common: any;
}

const Section: React.FC<SectionProps> = ({ title, items, colors, common }) => {
    if (items.length === 0) return null;
    return (
        <View style={{ marginBottom: 16 }}>
            <FlexText style={[common.bodySmall, { fontWeight: '700', marginBottom: 8, opacity: 0.8 }]}>{title}</FlexText>
            <View style={{ gap: 8 }}>
                {items.map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {item.solarIcon ? (
                            <item.solarIcon size={18} color={colors.text} style={{ marginRight: 10, width: 20 }} />
                        ) : (
                            <FlexText style={{ fontSize: 14, marginRight: 10, width: 20, textAlign: 'center' }}>{item.emoji}</FlexText>
                        )}
                        <FlexText style={[{ fontSize: 14, fontWeight: '600', flexShrink: 1 }]} numberOfLines={2}>{item.label}</FlexText>
                    </View>
                ))}
            </View>
        </View>
    );
};

const ProfileBriefInfo: React.FC<ProfileBriefInfoProps> = ({ profile, workplaces = [], homeInfo }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();

    const workItems: any[] = [];
    if (workplaces.length > 0) {
        workItems.push({
            solarIcon: CaseMinimalistic,
            label: t('profile.briefInfo.workAt', { position: workplaces[0].position, company: workplaces[0].company_name })
        });
    }

    const eduItems: any[] = [];
    if (profile?.college) eduItems.push({ solarIcon: SquareAcademicCap, label: profile.college });
    if (profile?.highschool) eduItems.push({ solarIcon: NotebookBookmark, label: profile.highschool });

    // Hometown/Address
    const homeItems: any[] = [];
    if (homeInfo) homeItems.push({ solarIcon: PointOnMap, label: homeInfo });

    if (!workItems.length && !eduItems.length && !homeItems.length) return null;

    return (
        <View style={{ paddingTop: 16 }}>
            <Section title={t('profile.briefInfo.sections.work')} items={workItems} colors={colors} common={common} />
            <Section title={t('profile.briefInfo.sections.education')} items={eduItems} colors={colors} common={common} />
            <Section title={t('profile.briefInfo.sections.placesLived')} items={homeItems} colors={colors} common={common} />
        </View>
    );
};

export default ProfileBriefInfo;
