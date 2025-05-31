module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native|@expo|expo-.*|@expo-.*/.*|react-native-.*|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base))'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};