// ─── Add a new screen: create i18n/locales/zh/<screenName>.ts then import it here ───

import bookmarks from './zh/bookmarks';
import create from './zh/create';
import dashboard from './zh/dashboard';
import gallery from './zh/gallery';
import hashtag from './zh/hashtag';
import home from './zh/home';
import languageSettings from './zh/languageSettings';
import navigation from './zh/navigation';
import notes from './zh/notes';
import onboarding from './zh/onboarding';
import post from './zh/post';
import profile from './zh/profile';
import search from './zh/search';
import settings from './zh/settings';
import shots from './zh/shots';
import themeSettings from './zh/themeSettings';
import serviceSettings from './zh/serviceSettings';
import wallpaperOverlay from './zh/wallpaperOverlay';

const zh = {
    bookmarks,
    create,
    dashboard,
    gallery,
    hashtag,
    home,
    settings,
    languageSettings,
    navigation,
    notes,
    onboarding,
    post,
    profile,
    search,
    shots,
    themeSettings,
    serviceSettings,
    wallpaperOverlay,
} as const;

export default zh;
