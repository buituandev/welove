import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { FlexText } from "./FlexText";

interface CaptionTextProps {
  caption: string;
  colors: any;
  common: any;
  maxLines?: number;
}

// Simple text parsing for hashtags, mentions, and links
const parseCaption = (text: string) => {
  const regex = /(#[^\s]+|@[^\s]+|https?:\/\/[^\s]+)/gu;
  const parts: { type: 'text' | 'tag' | 'mention' | 'link'; text: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    // Determine type and add the match
    const matchedText = match[0];
    if (matchedText.startsWith('#')) {
      parts.push({ type: 'tag', text: matchedText });
    } else if (matchedText.startsWith('@')) {
      parts.push({ type: 'mention', text: matchedText });
    } else {
      parts.push({ type: 'link', text: matchedText });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, text }];
};

const CaptionText = ({ caption, colors, common, maxLines = 3 }: CaptionTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const CHARACTER_THRESHOLD = 150;
  // Add a 20 character buffer so we don't show "Read more" to reveal just 1 or 2 extra characters
  const needsReadMore = caption.length > CHARACTER_THRESHOLD + 20;
  const parsedParts = parseCaption(caption);

  const handlePartPress = useCallback((part: { type: string; text: string }) => {
    if (part.type === 'tag') {
      const tag = part.text.slice(1); // remove the leading #
      router.push(`/hashtag/${encodeURIComponent(tag)}`);
    }
  }, [router]);

  const renderParts = (parts: ReturnType<typeof parseCaption>) => {
    return parts.map((part, index) => {
      const isHighlight = part.type !== 'text';
      const isTappable = part.type === 'tag';
      return (
        <FlexText
          key={index}
          style={isHighlight ? { color: colors.verify, fontWeight: '500' } : undefined}
          onPress={isTappable ? () => handlePartPress(part) : undefined}
          suppressHighlighting={isTappable ? false : undefined}
        >
          {part.text}
        </FlexText>
      );
    });
  };

  const renderTruncatedText = () => {
    if (!expanded && needsReadMore) {
      const truncatedCaption = caption.slice(0, CHARACTER_THRESHOLD);
      return renderParts(parseCaption(truncatedCaption));
    }
    return renderParts(parsedParts);
  };

  return (
    <View>
      <FlexText
        style={[common.body, { color: colors.text, marginTop: 10, marginBottom: 10, fontSize: 14 }]}
      >
        {renderTruncatedText()}
        {!expanded && needsReadMore && (
          <FlexText
            onPress={() => setExpanded(true)}
            style={{ color: colors.verify, fontWeight: '600' }}
            suppressHighlighting={true}
          >
            {' ...Read more'}
          </FlexText>
        )}
      </FlexText>
    </View>
  );
};

export default CaptionText;
