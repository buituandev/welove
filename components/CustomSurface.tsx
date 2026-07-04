import { useThemeContext } from "@/context/ThemeContext";
import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { FlexText } from "./FlexText";

export interface CustomSurfaceProps extends Omit<ViewProps, "style"> {
  position?: "first" | "middle" | "last" | "single" | "none";
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
  total?: number;
  onPress?: () => void;
  activeOpacity?: number;
  divided?: boolean;
  dividerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "secondary" | "tertiary" | "transparent";

  // Customizable border radius properties
  borderRadiusLarge?: number;
  borderRadiusSmall?: number;

  // Optional icon layout properties
  icon?: React.ReactNode;
  iconBackgroundColor?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const CustomSurface: React.FC<CustomSurfaceProps> = ({
  position,
  isFirst,
  isLast,
  index,
  total,
  onPress,
  activeOpacity = 0.7,
  divided = false,
  dividerStyle,
  style,
  variant = "default",
  borderRadiusLarge = 24,
  borderRadiusSmall = 5,
  icon,
  iconBackgroundColor,
  title,
  description,
  children,
  ...props
}) => {
  const { colors } = useThemeContext();

  const cardStyle = useMemo(() => {
    let resolvedPosition = position;
    if (typeof isFirst === "boolean" || typeof isLast === "boolean") {
      if (isFirst && isLast) {
        resolvedPosition = "single";
      } else if (isFirst) {
        resolvedPosition = "first";
      } else if (isLast) {
        resolvedPosition = "last";
      } else {
        resolvedPosition = "middle";
      }
    } else if (typeof index === "number" && typeof total === "number") {
      if (total <= 1) {
        resolvedPosition = "single";
      } else if (index === 0) {
        resolvedPosition = "first";
      } else if (index === total - 1) {
        resolvedPosition = "last";
      } else {
        resolvedPosition = "middle";
      }
    }

    switch (resolvedPosition) {
      case "single":
        return {
          borderRadius: borderRadiusLarge,
        };
      case "first":
        return {
          borderTopLeftRadius: borderRadiusLarge,
          borderTopRightRadius: borderRadiusLarge,
          borderBottomLeftRadius: borderRadiusSmall,
          borderBottomRightRadius: borderRadiusSmall,
        };
      case "last":
        return {
          borderBottomLeftRadius: borderRadiusLarge,
          borderBottomRightRadius: borderRadiusLarge,
          borderTopLeftRadius: borderRadiusSmall,
          borderTopRightRadius: borderRadiusSmall,
        };
      case "middle":
        return {
          borderRadius: borderRadiusSmall,
        };
      case "none":
      default:
        return {};
    }
  }, [position, isFirst, isLast, index, total, borderRadiusLarge, borderRadiusSmall]);

  const bgStyle = useMemo(() => {
    switch (variant) {
      case "secondary":
        return { backgroundColor: colors.card };
      case "tertiary":
        return { backgroundColor: colors.background };
      case "transparent":
        return { backgroundColor: "transparent" };
      case "default":
      default:
        return { backgroundColor: colors.surfaceContainer };
    }
  }, [variant, colors]);

  const containerStyle = StyleSheet.flatten([
    { padding: 16 },
    bgStyle,
    cardStyle,
    icon ? { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 } : undefined,
    style,
  ]) as ViewStyle;

  const renderedChildren = useMemo(() => {
    if (!divided || !children) {
      return children;
    }
    const array = React.Children.toArray(children).filter(Boolean);
    return array.map((child, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && (
          <View
            style={StyleSheet.flatten([
              {
                height: 1,
                backgroundColor: colors.divider || "rgba(255,255,255,0.1)",
                marginVertical: 8,
              },
              dividerStyle,
            ])}
          />
        )}
        {child}
      </React.Fragment>
    ));
  }, [children, divided, dividerStyle, colors.divider]);

  const innerContent = (
    <>
      {icon && (
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: iconBackgroundColor || "rgba(0, 0, 0, 0.05)" }
          ]}
        >
          {icon}
        </View>
      )}
      {icon ? (
        <View style={styles.contentWrapper}>
          {title && (
            typeof title === "string" ? (
              <FlexText style={[styles.titleText, { color: colors.text }]}>{title}</FlexText>
            ) : (
              title
            )
          )}
          {description && (
            typeof description === "string" ? (
              <FlexText style={[styles.descText, { color: colors.muted }]}>{description}</FlexText>
            ) : (
              description
            )
          )}
          {renderedChildren}
        </View>
      ) : (
        renderedChildren
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={containerStyle}
        {...(props as any)}
      >
        {innerContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {innerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  descText: {
    fontSize: 14,
    marginTop: 2,
  },
});
