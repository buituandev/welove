const {
    getSentryExpoConfig
} = require("@sentry/react-native/metro");
const { withUniwindConfig } = require("uniwind/metro");

module.exports = withUniwindConfig((() => {
    const config = getSentryExpoConfig(__dirname);

    const { transformer, resolver } = config;

    config.transformer = {
        ...transformer,
        babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
        inlineRequires: true,
    };
    config.resolver = {
        ...resolver,
        assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
        sourceExts: [...resolver.sourceExts, "svg"],
    };

    return config;
})(), {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
});