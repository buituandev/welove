import { StyleSheet } from 'react-native';
import { COVER_HEIGHT, INFO_CARD_HEIGHT, INFO_CARD_WIDTH } from './constants';

export const headerStyles = StyleSheet.create({
  coverImage: {
    width: '100%',
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  meshGradient: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    borderRadius: 28,
    marginTop: -70,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: -40,
    gap: 12,
  },
  usernameText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },
  pronounsText: {
    fontSize: 12,
    marginTop: 8,
  },
  bioText: {
    paddingTop: 8,
  },
  cardsScroll: {
    marginVertical: 16,
    marginHorizontal: -16,
  },
  cardsScrollContent: {
    paddingHorizontal: 16,
  },
  musicPlayBtn: {
    borderRadius: 999,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  facebookIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoCardOuter: {
    flex: 1,
    marginRight: 8,
  },
  infoCardInner: {
    height: INFO_CARD_HEIGHT,
    width: INFO_CARD_WIDTH,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoCardLabel: {
    marginHorizontal: 10,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarFrame: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  avatarBackplate: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  identity: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  identityNameRow: {
    gap: 4,
  },
  identityName: {
    fontWeight: '700',
  },
  identityFlag: {
    borderRadius: 2,
    marginLeft: 4,
  },
  identityCounts: {
    gap: 6,
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionCard: {
    flex: 1,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  familyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  familyAvatarImage: {
    width: 36,
    height: 36,
  },
  familyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  flex1: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
