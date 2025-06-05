const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// Add TypeScript transformer configuration
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-typescript-transformer'),
};

// Add TypeScript extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Export the config
module.exports = withNativeWind(config, { input: './global.css' });