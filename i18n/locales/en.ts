// ─── Add a new screen: create i18n/locales/en/<screenName>.ts then import it here ───

import bookmarks from './en/bookmarks';
import create from './en/create';
import dashboard from './en/dashboard';
import gallery from './en/gallery';
import hashtag from './en/hashtag';
import home from './en/home';
import languageSettings from './en/languageSettings';
import navigation from './en/navigation';
import notes from './en/notes';
import onboarding from './en/onboarding';
import post from './en/post';
import profile from './en/profile';
import search from './en/search';
import settings from './en/settings';
import shots from './en/shots';
import themeSettings from './en/themeSettings';
import wallpaperOverlay from './en/wallpaperOverlay';

const en = {
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
    wallpaperOverlay,
} as const;

export default en;
