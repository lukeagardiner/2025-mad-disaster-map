// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle, TextStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See FontAwesome5 here: https://icons.expo.fyi
  // FontAwesome5
  'magnifyingglass': 'search', // FontAwesome5's "search" icon
  'exclamationmark.triangle.fill': 'exclamation-triangle',
  'person': 'user-circle',
  'house.fill': 'home',

} as Record<string, string>; // Updated type to allow FontAwesome5 icon names

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {

  // debug console log
  console.log(`Icon mapping for "${name}":`, MAPPING[name]); // debug

  //const materialIconName = MAPPING[name] || 'error'; // Default icon if mapping is missing for safety //added while debugging
  //return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
  // Fallback to 'question-circle' if mapping is missing
  const fontAwesomeIconName = MAPPING[name] || 'question-circle';

  //return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style as StyleProp<TextStyle>} />;  // added while debugging
    // Return the FontAwesome5 component
    return (
      <FontAwesome5
        color={color}
        size={size}
        name={fontAwesomeIconName}
        style={style as StyleProp<TextStyle>}
      />
    );
}
