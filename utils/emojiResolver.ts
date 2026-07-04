export const emojiContext = require.context('../assets/emoji', false, /\.webp$/);

export const EMOJI_ASSETS = emojiContext.keys().reduce((acc: Record<string, any>, key: string) => {
    const name = key.replace('./', '');
    acc[name] = emojiContext(key);
    return acc;
}, {});

export const EMOJI_NAMES = Object.keys(EMOJI_ASSETS);
