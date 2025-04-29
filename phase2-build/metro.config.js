/*
const { getDefaultConfig } = require('expo/metro-config'); // existing
const { withNativeWind } = require('nativewind/metro'); // existing

const config = getDefaultConfig(__dirname); // existing

// new stuff for fixes 1
config.transformer = {
    ...config.transformer,
    //babelTransformerPath: require.resolve('react-native-shadow-gh'),  // fixes replaced
    babelTransformerPath: require.resolve('react-native-shadow'),
};
// new stuff for fixes 2
config.resolver = {
    ...config.resolver,
    assetExts: [...config.resolver.assetExts, 'db', 'ttf', 'obj', 'gltf', 'glb', 'otf',],
    sourceExts: [...config.resolver.sourceExts, 'cjs'],
};


module.exports = withNativeWind(config, { // existing
  input: "./app/globals.css", // or wherever your global css is  // existing
}); // existing 
*/

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './app/globals.css' });