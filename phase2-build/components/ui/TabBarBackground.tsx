import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Colors } from '@/constants/Colors';

// This is a shim for web and Android where the tab bar is generally opaque.
// current code here not working with updated (tabs)/_layout.tsx so refactoring
/*
export default undefined;

export function useBottomTabOverflow() {
  return 0;
}
*/


const TabBarBackground = () => {
  const { theme } = useTheme();

  // Determine the background color based on the theme
  const backgroundColor =
    theme === 'dark' ? Colors.dark.background : Colors.light.background;

  return <View style={[styles.background, { backgroundColor }]} />;
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
});

export default TabBarBackground;

export function useBottomTabOverflow() {
  return 0;
}
