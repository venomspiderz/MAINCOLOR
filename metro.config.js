const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support for NativeWind
  isCSSEnabled: true,
});

// Add additional configuration for TypeScript
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'ts', 'tsx'];
config.transformer.babelTransformerPath = require.resolve('react-native-typescript-transformer');

module.exports = withNativeWind(config, { input: './global.css' });