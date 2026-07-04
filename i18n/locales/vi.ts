// ─── Add a new screen: create i18n/locales/vi/<screenName>.ts then import it here ───

import bookmarks from './vi/bookmarks';
import create from './vi/create';
import dashboard from './vi/dashboard';
import gallery from './vi/gallery';
import hashtag from './vi/hashtag';
import home from './vi/home';
import languageSettings from './vi/languageSettings';
import navigation from './vi/navigation';
import notes from './vi/notes';
import onboarding from './vi/onboarding';
import post from './vi/post';
import profile from './vi/profile';
import search from './vi/search';
import serviceSettings from './vi/serviceSettings';
import settings from './vi/settings';
import shots from './vi/shots';
import themeSettings from './vi/themeSettings';
import wallpaperOverlay from './vi/wallpaperOverlay';

const vi = {
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

export default vi;
