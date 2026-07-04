import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import LocationIcon from "@/assets/images/svg/location.svg";
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, TouchableOpacity, View } from 'react-native';
import { ProfileAddress } from '../../types/profileaddress';
import { ProfileDetail } from '../../types/profiledetail';
import { ProfileLink } from '../../types/profilelink';
import { ProfileMusic } from '../../types/profilemusic';
import { Workplace } from '../../types/profileworplace';
import type { TabType } from '../../viewmodels/ProfileHeaderViewModel';
import { useProfileHeaderViewModel } from '../../viewmodels/ProfileHeaderViewModel';
import { FlexText } from '../FlexText';
import BirthdayCard from './BirthdayCard';
import { COVER_HEIGHT, FACEBOOK_BLUE, SOCIAL_BG_URL } from './header/constants';
import {
  ActionButtonsSection,
  AvatarSection,
  CoverSection,
  FamilyStackSection,
  HeaderInfoCard,
  HeaderTabBar,
  IdentitySection,
} from './header/parts';
import { headerStyles } from './header/styles';

const CaseMinimalistic = ({ size, ...props }: any) => <Ionicons name="briefcase" size={size} {...props} />;
const PointOnMap = ({ size, ...props }: any) => <LocationIcon width={size} height={size} {...props} />;
const PlayCircleBold = ({ size, ...props }: any) => <Ionicons name="play-circle" size={size} {...props} />;
const PlayCircleOutline = ({ size, ...props }: any) => <Ionicons name="play-circle-outline" size={size} {...props} />;

interface ProfileHeaderProps {
  scrollY: Animated.Value;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabContent?: React.ReactNode;
  profile?: ProfileDetail | null;
  isMe?: boolean;
  isOwner?: boolean;
  musicSheetRef?: React.RefObject<TrueSheet | null>;
  socialSheetRef?: React.RefObject<TrueSheet | null>;
  addressSheetRef?: React.RefObject<TrueSheet | null>;
  workplaceSheetRef?: React.RefObject<TrueSheet | null>;
  familySheetRef?: React.RefObject<TrueSheet | null>;
  briefSheetRef?: React.RefObject<any>;
  workplaces?: Workplace[];
  music?: ProfileMusic[];
  socialLinks?: ProfileLink[];
  addresses?: ProfileAddress[];
  onMusicEndReached?: () => void;
  onSocialEndReached?: () => void;
  onAddressesEndReached?: () => void;
  onWorkplacesEndReached?: () => void;
  imageCount?: number;
  videoCount?: number;
  postCount?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = memo(({
  scrollY,
  activeTab,
  onTabChange,
  tabContent,
  profile,
  musicSheetRef,
  socialSheetRef,
  addressSheetRef,
  workplaceSheetRef,
  familySheetRef,
  briefSheetRef,
  workplaces = [],
  music = [],
  socialLinks = [],
  addresses = [],
  imageCount = 0,
  videoCount = 0,
  postCount = 0,
  isMe = false,
  isOwner = false,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const vm = useProfileHeaderViewModel({
    scrollY,
    activeTab,
    onTabChange,
    profile,
    isMe,
    music,
    addresses,
  });

  const showMusicCard = !!vm.currentMusic && isMe;
  const showFacebookCard = vm.hasFacebook && !!profile;
  const showSocialCard = socialLinks.length > 0;
  const showAddressesCard = addresses.length > 0;
  const showWorkplacesCard = workplaces.length > 0;

  return (
    <>
      <CoverSection vm={vm} coverUrl={profile?.cover_url} />

      <SquircleView
        cornerSmoothing={100}
        preserveSmoothing
        style={[headerStyles.contentWrapper, { backgroundColor: vm.colors.background }]}
      >
        <View style={vm.common.screenPadding}>
          <View style={headerStyles.topRow}>
            <AvatarSection vm={vm} />
            <IdentitySection
              vm={vm}
              profile={profile}
              imageCount={imageCount}
              videoCount={videoCount}
              postCount={postCount}
            />
          </View>

          <View>
            {profile?.username && (
              <FlexText style={[headerStyles.usernameText, { color: vm.colors.text }]}>@{profile.username}</FlexText>
            )}
            {profile?.pronouns && (
              <FlexText style={[vm.common.muted, headerStyles.pronounsText]}>{profile.pronouns}</FlexText>
            )}
            {profile?.bio && (
              <FlexText style={[vm.common.bodySmall, headerStyles.bioText]}>{profile.bio}</FlexText>
            )}

            <ActionButtonsSection vm={vm} isOwner={isOwner} onKnowMe={() => briefSheetRef?.current?.present()} />

            {profile && (
              <FamilyStackSection
                vm={vm}
                profile={profile}
                onPress={() => familySheetRef?.current?.present()}
              />
            )}

            <ScrollView
              style={headerStyles.cardsScroll}
              contentContainerStyle={headerStyles.cardsScrollContent}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {profile?.birthday && <BirthdayCard birthday={profile.birthday} />}

              {showMusicCard && vm.currentMusic && (
                <HeaderInfoCard
                  onPress={() => musicSheetRef?.current?.present()}
                  backgroundImageUri={vm.currentMusic.cover_url}
                  showDimOverlay
                  textColor="white"
                  labelStyle={vm.common.bodySmall}
                  leading={(
                    <TouchableOpacity
                      onPress={vm.toggleMusic}
                      style={[headerStyles.musicPlayBtn, { backgroundColor: vm.colors.card }]}
                    >
                      {vm.isPlaying
                        ? <PlayCircleBold size={32} color={vm.colors.text} />
                        : <PlayCircleOutline size={32} color={vm.colors.text} />}
                    </TouchableOpacity>
                  )}
                >
                  {vm.currentMusic.artist} - {vm.currentMusic.title}
                </HeaderInfoCard>
              )}

              {showFacebookCard && (
                <HeaderInfoCard
                  onPress={() => router.push({ pathname: '/fprofile', params: { profile: JSON.stringify(profile) } })}
                  backgroundColor={FACEBOOK_BLUE}
                  textColor="#FFF"
                  labelStyle={vm.common.label}
                  leading={(
                    <View style={headerStyles.facebookIconBubble}>
                      <Ionicons name="logo-facebook" size={28} color="#FFF" />
                    </View>
                  )}
                >
                  {t('profile.header.cards.facebookProfile')}
                </HeaderInfoCard>
              )}

              {showSocialCard && (
                <HeaderInfoCard
                  onPress={() => socialSheetRef?.current?.present()}
                  backgroundColor={vm.colors.card}
                  backgroundImageUri={SOCIAL_BG_URL}
                  showDimOverlay
                  textColor="white"
                  centerText
                  labelStyle={vm.common.label}
                >
                  {socialLinks.length} {t('profile.header.countSocialLinks', { count: socialLinks.length })}
                </HeaderInfoCard>
              )}

              {showAddressesCard && (
                <HeaderInfoCard
                  onPress={() => addressSheetRef?.current?.present()}
                  backgroundColor={vm.colors.card}
                  showTintOverlay={vm.colors.text}
                  labelStyle={vm.common.label}
                  leading={(
                    <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                      <PointOnMap size={28} color={vm.colors.text} />
                    </View>
                  )}
                >
                  {addresses.length} {t('profile.header.countAddresses', { count: addresses.length })}
                </HeaderInfoCard>
              )}

              {showWorkplacesCard && (
                <HeaderInfoCard
                  onPress={() => workplaceSheetRef?.current?.present()}
                  backgroundColor={vm.colors.card}
                  showTintOverlay={vm.colors.text}
                  labelStyle={vm.common.label}
                  leading={(
                    <View style={[headerStyles.iconBubble, { backgroundColor: vm.colors.card }]}>
                      <CaseMinimalistic size={28} color={vm.colors.text} />
                    </View>
                  )}
                >
                  {workplaces.length} {t('profile.header.countWorkplaces', { count: workplaces.length })}
                </HeaderInfoCard>
              )}
            </ScrollView>

            <HeaderTabBar vm={vm} activeTab={activeTab} />
            {tabContent}
          </View>
        </View>
      </SquircleView>
    </>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

export { COVER_HEIGHT };
export default ProfileHeader;
