import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Application from 'expo-application';
import { router } from "expo-router";
import * as Updates from 'expo-updates';
import { CustomSurface } from "@/components/CustomSurface";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AboutScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const version = Application.nativeApplicationVersion;
    const buildVersion = Application.nativeBuildVersion;
    const inset = useSafeAreaInsets();
    const runtimeVersion = __DEV__ ? 'dev_environment' : (Updates.updateId ?? 'unknown');

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: colors.background, padding: 16 }}>
            <ExpoImage style={[StyleSheet.absoluteFill, { opacity: 1 }]} source={require('../../assets/images/gradient.png')} contentFit="cover" />
            <View style={{ position: 'absolute', top: inset.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <ExpoImage source={require('../../assets/images/logo_head.png')} style={{ width: 100, height: 100, marginBottom: 16 }} contentFit="contain" />
            <FlexText style={[common.headline, { marginBottom: 48 }]}>Welcome to WeLove!</FlexText>
            <View style={{ gap: 3, width: '100%' }}>
                <CustomSurface
                    isFirst
                    style={{ padding: 16 }}
                >
                    <View>
                        <FlexText style={[common.body]}>App version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{version}.{buildVersion}</FlexText>
                    </View>
                </CustomSurface>
                <CustomSurface
                    isLast
                    style={{ padding: 16 }}
                >
                    <View>
                        <FlexText style={[common.body]}>Runtime version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{runtimeVersion}</FlexText>
                    </View>
                </CustomSurface>
            </View>
        </View>
    );
};

export default AboutScreen;