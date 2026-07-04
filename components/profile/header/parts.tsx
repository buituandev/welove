import VerifiedIcon from '@/icons/verified';
import { MeshGradient } from '@kuss/react-native-mesh-gradient';
import Ionicons from "@react-native-vector-icons/ionicons/static";
import ChatIcon from "@/assets/images/svg/chat-double.svg";
import { Image } from 'expo-image';
import { MediaViewer } from 'expo-media-viewer';
import { useRouter } from 'expo-router';
import { SquircleView } from 'expo-squircle-view';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import { ProfileDetail } from '../../../types/profiledetail';
import { getFamilyAvatarSource } from '../../../utils/familyAvatar';
import { FlexText } from '../../FlexText';
import DynamicAvatar from '../DynamicAvatar';
import QuickPreviewModal from '../QuickPreviewModal';
import { AVATAR_FRAME_URL, FACEBOOK_BLUE, FALLBACK_AVATAR_URL } from './constants';
import { headerStyles } from './styles';

const HeartAngle = ({ size, color, ...props }: any) => <Ionicons name="heart" size={size} color={color} {...props} />;
const Heart = ({ size, color, ...props }: any) => <Ionicons name="heart" size={size} color={color} {...props} />;
const ChatSquareLike = ({ size, color, ...props }: any) => <ChatIcon width={size} height={size} color={color} {...props} />;

const AnimatedExpoImage = Animated.createAnimatedComponent(Image);

export const CoverSection = ({
  vm,
  coverUrl,
}: {
  vm: any;
  coverUrl?: string | null;
}) => {
  const transform = [{ translateY: vm.coverTranslateY }];
  if (vm.hasCover) {
    return (
      <AnimatedExpoImage
        source={{ uri: coverUrl || '' }}
        style={[headerStyles.coverImage, { transform }]}
        contentFit="cover"
      />
    );
  }

  return (
    <Animated.View style={[headerStyles.coverImage, { transform }]}>
      {vm.gradientColors.length === 4 && (
        <MeshGradient
          brightness={vm.meshGradientDefaults.brightness}
          contrast={vm.meshGradientDefaults.contrast}
          speed={vm.meshGradientDefaults.speed}
          colors={vm.gradientColors}
          frequency={vm.meshGradientDefaults.frequency}
          amplitude={vm.meshGradientDefaults.amplitude}
          style={headerStyles.meshGradient}
        />
      )}
    </Animated.View>
  );
};

export const AvatarSection = ({ vm }: { vm: any }) => {
  const avatarStyle = vm.common.avatarLarge;
  return (
    <View style={headerStyles.avatarWrapper}>
      {vm.threedEmoji ? (
        <>
          <Pressable
            onLongPress={vm.showAvatarPreview}
            onPressOut={vm.hideAvatarPreview}
            delayLongPress={200}
          >
            <DynamicAvatar
              uri={vm.currentAvatar || FALLBACK_AVATAR_URL}
              threedEmoji={vm.threedEmoji}
              styles={avatarStyle}
            />
          </Pressable>
          <QuickPreviewModal
            visible={vm.avatarPreviewVisible}
            imageUrl={vm.currentAvatar}
            onClose={vm.hideAvatarPreview}
            blurhash={null}
          />
        </>
      ) : vm.currentAvatar ? (
        <MediaViewer
          items={[{ type: 'image', source: vm.currentAvatar }]}
          config={{ theme: 'dark', thumbnail: { fit: 'cover' } }}
          renderLayout={({ renderItem }) =>
            renderItem(0, { frame: { ...avatarStyle } })
          }
        />
      ) : vm.genderFallbackSource ? (
        <Image source={vm.genderFallbackSource} contentFit="cover" style={avatarStyle} />
      ) : (
        <Image source={{ uri: FALLBACK_AVATAR_URL }} contentFit="cover" style={avatarStyle} />
      )}
      <Image source={{ uri: AVATAR_FRAME_URL }} style={headerStyles.avatarFrame} contentFit="cover" />
      <View style={[headerStyles.avatarBackplate, { backgroundColor: vm.colors.background }]} />
    </View>
  );
};

export const IdentitySection = ({
  vm,
  profile,
  imageCount,
  videoCount,
  postCount,
}: {
  vm: any;
  profile?: ProfileDetail | null;
  imageCount: number;
  videoCount: number;
  postCount: number;
}) => {
  const { t } = useTranslation();
  return (
    <View style={headerStyles.identity}>
      <View style={[vm.common.row, headerStyles.identityNameRow]}>
        <FlexText style={[vm.common.heading, headerStyles.identityName]}>
          {profile?.name || t('profile.header.notFound')}
        </FlexText>
        {profile?.is_verified && <VerifiedIcon size={14} />}
        {vm.flagCode && <CountryFlag isoCode={vm.flagCode} size={12} style={headerStyles.identityFlag} />}
      </View>
      <View style={[vm.common.row, headerStyles.identityCounts]}>
        <FlexText style={vm.common.bodySmall}>
          <FlexText style={headerStyles.bold}>{imageCount}</FlexText>{' '}
          {t('profile.header.countImages', { count: imageCount })}
        </FlexText>
        <FlexText style={[vm.common.bodySmall, { color: vm.colors.muted }]}>·</FlexText>
        <FlexText style={vm.common.bodySmall}>
          <FlexText style={headerStyles.bold}>{videoCount}</FlexText>{' '}
          {t('profile.header.countVideos', { count: videoCount })}
        </FlexText>
        <FlexText style={[vm.common.bodySmall, { color: vm.colors.muted }]}>·</FlexText>
        <FlexText style={vm.common.bodySmall}>
          <FlexText style={headerStyles.bold}>{postCount}</FlexText>{' '}
          {t('profile.header.countPosts', { count: postCount })}
        </FlexText>
      </View>
    </View>
  );
};

export const ActionButtonsSection = ({ vm, isOwner, onKnowMe }: { vm: any; isOwner?: boolean; onKnowMe?: () => void }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBlueButtonPress = () => {
    if (isOwner) {
      router.push({
        pathname: '/profile/edit-profile',
        params: { id: vm.profile?.id || 'me' }
      });
    } else {
      // Show add love action
    }
  };

  return (
    <View style={headerStyles.actionRow}>
      <SquircleView cornerSmoothing={60} preserveSmoothing borderRadius={10} style={[headerStyles.actionCard, { backgroundColor: FACEBOOK_BLUE }]}>
        <TouchableOpacity onPress={handleBlueButtonPress} style={headerStyles.actionButton}>
          {isOwner ? (
            <Ionicons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          ) : (
            <HeartAngle size={22} color="#fff" />
          )}
          <FlexText style={[headerStyles.actionLabel, { color: '#fff' }]}>
            {isOwner ? t('profile.header.actions.editProfile', 'Edit Profile') : t('profile.header.actions.addLove')}
          </FlexText>
        </TouchableOpacity>
      </SquircleView>
      <SquircleView cornerSmoothing={60} preserveSmoothing borderRadius={10} style={[headerStyles.actionCard, { backgroundColor: vm.colors.card }]}>
        <TouchableOpacity onPress={onKnowMe} style={[headerStyles.actionButton, { paddingVertical: 6 }]}>
          <ChatSquareLike size={22} color={vm.colors.text} />
          <FlexText style={[headerStyles.actionLabel, { color: vm.colors.text }]}>
            {t('profile.header.actions.knowMe')}
          </FlexText>
        </TouchableOpacity>
      </SquircleView>
    </View>
  );
};

export const FamilyStackSection = ({
  vm,
  profile,
  onPress,
}: {
  vm: any;
  profile: ProfileDetail;
  onPress?: () => void;
}) => {
  const { t } = useTranslation();
  const lovedOnes = profile.loved_ones ?? [];
  if (!lovedOnes.length) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={headerStyles.familyRow}>
      <View style={vm.common.row}>
        {lovedOnes.slice(0, 4).map((person, i) => (
          <View
            key={`fam-${i}`}
            style={[
              headerStyles.familyAvatar,
              { marginLeft: i === 0 ? 0 : -10, borderColor: vm.colors.background, zIndex: 10 - i },
            ]}
          >
            <Image source={getFamilyAvatarSource(person.label)} style={headerStyles.familyAvatarImage} resizeMode="cover" />
          </View>
        ))}
      </View>
      <View style={headerStyles.flex1}>
        <FlexText style={[headerStyles.familyLabel, { color: vm.colors.text }]} numberOfLines={1}>
          {lovedOnes.length} {t('profile.header.countFamilyMembers', { count: lovedOnes.length })}
        </FlexText>
      </View>
      <Heart size={18} color={vm.colors.muted} />
    </TouchableOpacity>
  );
};

export const HeaderInfoCard = ({
  onPress,
  backgroundColor,
  backgroundImageUri,
  showDimOverlay,
  showTintOverlay,
  leading,
  textColor,
  centerText,
  labelStyle,
  children,
}: {
  onPress?: () => void;
  backgroundColor?: string;
  backgroundImageUri?: string;
  showDimOverlay?: boolean;
  showTintOverlay?: string;
  leading?: React.ReactNode;
  textColor?: string;
  centerText?: boolean;
  labelStyle?: any;
  children: React.ReactNode;
}) => (
  <SquircleView cornerSmoothing={60} preserveSmoothing borderRadius={9999} style={headerStyles.infoCardOuter}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[headerStyles.infoCardInner, backgroundColor ? { backgroundColor } : null]}>
      {backgroundImageUri && (
        <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      {showDimOverlay && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />}
      {showTintOverlay && <View style={[StyleSheet.absoluteFill, { backgroundColor: showTintOverlay, opacity: 0.1 }]} />}
      {leading}
      <FlexText
        numberOfLines={2}
        style={[
          labelStyle,
          headerStyles.infoCardLabel,
          textColor ? { color: textColor } : null,
          centerText ? { textAlign: 'center' } : null,
        ]}
      >
        {children}
      </FlexText>
    </TouchableOpacity>
  </SquircleView>
);

export const HeaderTabBar = ({ vm, activeTab }: { vm: any; activeTab: string }) => {
  const pt = vm.colors.pillTab;
  return (
    <View style={headerStyles.tabBar}>
      {vm.tabs.map((tab: any) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={tab.onClick}
            activeOpacity={0.7}
            style={[headerStyles.tabPill, { backgroundColor: isActive ? pt.activeBg : pt.inactiveBg }]}
          >
            <FlexText style={[headerStyles.tabLabel, { color: isActive ? pt.activeText : pt.inactiveText }]}>
              {tab.label}
            </FlexText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
