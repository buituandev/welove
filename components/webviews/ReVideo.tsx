import { useThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useFocusEffect } from "expo-router/react-navigation";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { BackHandler, Linking, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type WebViewType from "react-native-webview";
import WebView from "react-native-webview";
import { Spinner } from "heroui-native/spinner";
import { supabase } from "@/services/login";

interface ReVideoProps {
    isUseSafeArea?: boolean;
    safeAreaColor?: string;
    urlWebview?: string;
}

const ReVideo = ({ isUseSafeArea = false, safeAreaColor = "transparent", urlWebview }: ReVideoProps) => {
    const params = useLocalSearchParams();
    const urlFromParams = typeof params.url === "string" ? params.url : undefined;
    const isUseSafeAreaFromParams = typeof params.isUseSafeArea === "string" ? params.isUseSafeArea === "true" : false;
    const safeAreaColorFromParams = typeof params.safeAreaColor === "string" ? params.safeAreaColor : "transparent";
    const isShowBackButtonFromParams = typeof params.isShowBackButton === "string" ? params.isShowBackButton === "true" : true;
    const injectTokenFromParams = typeof params.injectToken === "string" ? params.injectToken === "true" : false;
    const { colors } = useThemeContext();
    const [isLoading, setIsLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const webViewRef = useRef<WebViewType>(null);
    const insets = useSafeAreaInsets();

    const [session, setSession] = useState<any>(null);
    const [isSessionLoaded, setIsSessionLoaded] = useState(!injectTokenFromParams);

    useEffect(() => {
        if (!injectTokenFromParams) return;
        const fetchSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                setSession(data.session);
            } catch (e) {
                console.error("Failed to fetch session for webview:", e);
            } finally {
                setIsSessionLoaded(true);
            }
        };
        fetchSession();
    }, [injectTokenFromParams]);

    const injectedJS = useMemo(() => {
        if (!session) return undefined;
        const sessionStr = JSON.stringify(session);
        const token = session.access_token;
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
        const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "";

        return `
            (function() {
                try {
                    const host = window.location.hostname;
                    if (host === 'boy-server.vercel.app' || host.endsWith('.boy-server.vercel.app')) {
                        const sessionData = ${JSON.stringify(sessionStr)};
                        const tokenStr = ${JSON.stringify(token)};
                        const ref = ${JSON.stringify(projectRef)};
                        
                        localStorage.setItem('sb-' + ref + '-auth-token', sessionData);
                        localStorage.setItem('token', tokenStr);
                        localStorage.setItem('supabase.auth.token', sessionData);
                    }
                } catch (e) {
                    console.error('Injected JS error:', e);
                }
            })();
            true;
        `;
    }, [session]);

    const handleLoad = () => setIsLoading(false);

    const handleBack = useCallback(() => {
        if (canGoBack) {
            webViewRef.current?.goBack();
        } else {
            router.back();
        }
    }, [canGoBack]);

    // Handle Android hardware back button
    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
                if (canGoBack) {
                    webViewRef.current?.goBack();
                    return true; // consumed — don't exit
                }
                return false; // let the system handle it (navigate back)
            });
            return () => subscription.remove();
        }, [canGoBack])
    );

    return (
        <View style={{ flex: 1 }}>
            {isUseSafeAreaFromParams && <View style={{ paddingTop: insets.top, backgroundColor: safeAreaColorFromParams || safeAreaColor }}></View>}
            {isShowBackButtonFromParams && <View style={{ position: 'absolute', top: insets.top + 45, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={{
                        backgroundColor: colors.containerContent + "80",
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>}
            {!isSessionLoaded ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                    <Spinner size="lg" color={colors.text} />
                </View>
            ) : (
                <WebView
                    ref={webViewRef}
                    source={{ uri: urlFromParams || urlWebview || "https://google.com/" }}
                    style={{ marginBottom: isUseSafeAreaFromParams ? insets.bottom : 0 }}
                    onLoad={handleLoad}
                    onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
                    onFileDownload={({ nativeEvent: { downloadUrl } }) => {
                        if (downloadUrl) {
                            Linking.openURL(downloadUrl)
                        }
                    }}
                    allowsFullscreenVideo
                    domStorageEnabled={true}
                    javaScriptEnabled={true}
                    injectedJavaScriptBeforeContentLoaded={injectedJS}
                >
                    {isLoading && (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Spinner size="lg" color="white" />
                        </View>
                    )}
                </WebView>
            )}
        </View>
    )
}

export default ReVideo;