import bookmarks from './zhHant/bookmarks';
import create from './zhHant/create';
import dashboard from './zhHant/dashboard';
import gallery from './zhHant/gallery';
import hashtag from './zhHant/hashtag';
import home from './zhHant/home';
import languageSettings from './zhHant/languageSettings';
import navigation from './zhHant/navigation';
import notes from './zhHant/notes';
import onboarding from './zhHant/onboarding';
import post from './zhHant/post';
import profile from './zhHant/profile';
import search from './zhHant/search';
import settings from './zhHant/settings';
import shots from './zhHant/shots';
import themeSettings from './zhHant/themeSettings';
import serviceSettings from './zhHant/serviceSettings';
import wallpaperOverlay from './zhHant/wallpaperOverlay';

const zhHant = {
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

export default zhHant;
