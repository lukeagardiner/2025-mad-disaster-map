module.exports = {
    preset: 'jest-expo',
    setupFiles: [
        '<rootDir>/jest.setup.js',
        '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ],
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    transformIgnorePatterns: [
        "node_modules/(?!(jest-)?react-native|@react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|firebase|@firebase)"
    ],
    transform: {
        "^.+\\.(js|jsx|ts|tsx|mjs)$": "babel-jest"
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
};