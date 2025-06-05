const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// Add TypeScript extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Export the config
module.exports = withNativeWind(config, { input: './global.css' });