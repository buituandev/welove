export interface TextPart {
    text: string;
    type: 'text' | 'hashtag' | 'mention' | 'url';
}

export const parseCaption = (text: string): TextPart[] => {
    const parts: TextPart[] = [];

    // Updated regex: 
    // 1. Hashtags/Mentions: starts with # or @, followed by non-whitespace/non-special chars
    // 2. URLs: standard pattern
    // 3. Added 'u' flag for Unicode support
    const regex = /(#[^\s#@!$%^&*()+,.;?]+|@[^\s#@!$%^&*()+,.;?]+|(?:https?:\/\/|www\.)[^\s]+)/gu;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                text: text.substring(lastIndex, match.index),
                type: 'text',
            });
        }

        const matchText = match[0];
        let type: TextPart['type'] = 'text';

        if (matchText.startsWith('#')) {
            type = 'hashtag';
        } else if (matchText.startsWith('@')) {
            type = 'mention';
        } else if (matchText.startsWith('http') || matchText.startsWith('www')) {
            type = 'url';
        }

        parts.push({ text: matchText, type });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({
            text: text.substring(lastIndex),
            type: 'text',
        });
    }

    return parts.length > 0 ? parts : [{ text, type: 'text' }];
};