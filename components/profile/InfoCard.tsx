import { Bank } from '@/types/bank';
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
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from "react-native";
import { Image } from 'expo-image';
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { ProfileDetail } from "../../types/profiledetail";
import { FlexText } from '../FlexText';
import QuickPreviewModal from './QuickPreviewModal';

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

interface InfoCardProps {
    profile?: ProfileDetail | null;
}

const InfoCard: React.FC<InfoCardProps> = ({ profile }) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Format birthday
    const formatBirthday = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const parsedMetadata = useMemo(() => {
        if (!profile?.metadata) return null;
        try {
            return typeof profile.metadata === 'string'
                ? JSON.parse(profile.metadata)
                : profile.metadata;
        } catch {
            return null;
        }
    }, [profile]);

    const height = parsedMetadata?.height;
    const weight = parsedMetadata?.weight;
    const bankinfo: Bank = parsedMetadata?.banking;

    return (
        <View style={[common.card, { marginTop: 16, marginHorizontal: 16 }]}>
            {/* Name */}
            <FlexText style={[common.muted]}>{t('profile.info.fields.name')}</FlexText>
            <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                <FlexText style={[common.body, { flex: 1 }]}>
                    {profile?.name || t('profile.info.notSpecified')}
                </FlexText>
            </View>

            {/* Email */}
            {profile?.email && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.email')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.email}
                        </FlexText>
                        <Letter size={22} color={colors.text} />
                    </View>
                </>
            )}

            {profile?.phone && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.phone')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.phone}
                        </FlexText>
                        <Phone size={22} color={colors.text} />
                    </View>
                </>
            )}

            {bankinfo && (
                <>
                    <View style={common.divider} />
                    <TouchableOpacity onPress={() => {
                        if (!bankinfo.qrurl) return;
                        setSelectedImage(bankinfo.qrurl);
                        setIsModalVisible(true);
                    }}>
                        <FlexText style={[common.muted]}>{bankinfo.bankname}</FlexText>
                        <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                            <FlexText style={[common.body, { flex: 1 }]}>
                                {bankinfo.recipient} - {bankinfo.banknumber}
                            </FlexText>
                            <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 999, overflow: 'hidden', backgroundColor: colors.card }}>
                                <Image source={{ uri: bankinfo.logo || '' }} style={{ width: 24, height: 24 }} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </>
            )}

            {/* Gender */}
            {profile?.gender && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.gender')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { textTransform: 'capitalize' }]}>
                            {profile.gender}
                        </FlexText>
                        {profile.gender === 'male' ? <Men size={22} color={colors.text} /> : profile.gender === 'female' ? <Women size={22} color={colors.text} /> : null}
                    </View>
                </>
            )}

            {/* Birthday */}
            {profile?.birthday && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.birthday')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {formatBirthday(profile.birthday)}
                        </FlexText>
                        <Calendar size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Height */}
            {height && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.height')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {height} cm
                        </FlexText>
                        <MaterialIcons name="height" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Weight */}
            {weight && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.weight')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {weight} kg
                        </FlexText>
                        <Weigher size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Hometown */}
            {profile?.hometown && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.hometown')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.hometown}
                        </FlexText>
                        <PointOnMap size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Education - College */}
            {profile?.college && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.college')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.college}
                        </FlexText>
                        <SquareAcademicCap size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Education - High School */}
            {profile?.highschool && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.highSchool')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.highschool}
                        </FlexText>
                        <NotebookBookmark size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Username */}
            {profile?.username && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.username')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            @{profile.username}
                        </FlexText>
                        <Ionicons name="at-circle-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* License Plate */}
            {profile?.license_plate && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.licensePlate')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.license_plate}
                        </FlexText>
                        <Wheel size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Married Date */}
            {profile?.married_date && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.marriedDate')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {formatBirthday(profile.married_date)}
                        </FlexText>
                        <Ionicons name="heart-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Hobby */}
            {profile?.hobby && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.hobby')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.hobby}
                        </FlexText>
                        <Ionicons name="extension-puzzle-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Talent */}
            {profile?.talent && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.talent')}</FlexText>
                    <View style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                        <FlexText style={[common.body, { flex: 1 }]}>
                            {profile.talent}
                        </FlexText>
                        <Ionicons name="star-outline" size={22} color={colors.text} />
                    </View>
                </>
            )}

            {/* Loved Ones */}
            {profile?.loved_ones && profile.loved_ones.length > 0 && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted]}>{t('profile.info.fields.lovedOnes')}</FlexText>
                    <View style={{ gap: 4, marginTop: 4 }}>
                        {profile.loved_ones.map((person, index) => (
                            <View key={index} style={[common.row, { gap: 8, justifyContent: 'space-between' }]}>
                                <FlexText style={[common.body, { flex: 1 }]}>
                                    <FlexText style={{ fontWeight: '600' }}>{person.label}:</FlexText> {person.name}
                                </FlexText>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Show message if no info available */}
            {!profile?.gender && !profile?.birthday && !profile?.hometown && !profile?.college && !profile?.highschool && !profile?.username && !profile?.hobby && !profile?.talent && !profile?.license_plate && !profile?.married_date && !profile?.loved_ones?.length && (
                <>
                    <View style={common.divider} />
                    <FlexText style={[common.muted, { textAlign: 'center', marginTop: 8 }]}>
                        {t('profile.info.noAdditionalInformation')}
                    </FlexText>
                </>
            )}

            <QuickPreviewModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                imageUrl={selectedImage}
                blurhash={null}
            />
        </View>
    )
}

export default InfoCard;