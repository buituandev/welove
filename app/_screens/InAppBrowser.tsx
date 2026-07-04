import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router, useLocalSearchParams } from "expo-router";
import { Spinner } from "heroui-native/spinner";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Snackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useThemeContext } from "../../context/ThemeContext";

const InAppBrowser = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [showBlockedNotice, setShowBlockedNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const params = useLocalSearchParams<{ url?: string }>();
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;

  const initialUrl = useMemo(() => {
    if (!rawUrl) return "";
    try {
      return decodeURIComponent(rawUrl);
    } catch {
      return rawUrl;
    }
  }, [rawUrl]);

  const allowedHost = useMemo(() => {
    try {
      return new URL(initialUrl).host.toLowerCase();
    } catch {
      return "";
    }
  }, [initialUrl]);

  if (!initialUrl || !allowedHost) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating back button */}
      <View style={{ position: "absolute", top: insets.top + 16, left: 16, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.containerContent }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <WebView
        source={{ uri: initialUrl }}
        incognito
        style={{ marginTop: insets.top }}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onShouldStartLoadWithRequest={(request) => {
          try {
            const requestHost = new URL(request.url).host.toLowerCase();
            const allowed = requestHost === allowedHost;
            if (!allowed) {
              setShowBlockedNotice(true);
            }
            return allowed;
          } catch {
            return false;
          }
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Spinner size="lg" color={colors.text} />
        </View>
      )}
      <Snackbar
        visible={showBlockedNotice}
        onDismiss={() => setShowBlockedNotice(false)}
        duration={2000}
      >
        External redirects and popups are blocked.
      </Snackbar>
    </View>
  );
};

export default InAppBrowser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});
