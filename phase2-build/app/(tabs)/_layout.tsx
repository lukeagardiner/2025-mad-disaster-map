
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme'; // existing
import { useTheme } from '@/theme/ThemeContext';  // addedV2

export default function TabLayout() {
  //const colorScheme = useColorScheme(); // existing
  const { theme } = useTheme(); // addedV2

  return (
    <Tabs
      screenOptions={{
      //tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,  // existing
      tabBarActiveTintColor: Colors[theme ?? 'light'].tint,  // addedV2
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarBackground: TabBarBackground,
      tabBarStyle: Platform.select({
        ios: {
        // Use a transparent background on iOS to show the blur effect
        position: 'absolute',
        },
        default: {},
      }),
      }}>
      <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        //tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        //tabBarIcon: ({ color }) => <MaterialIcons name="home" size={28} color={color} />,
        tabBarIcon: ({ color }) => {
          const { theme } = useTheme();

          // define colour for light and dark themes
          const iconColor = theme === 'dark' ? '#ffffff' : '#000000';

          return <MaterialIcons name='home' size={28} color={iconColor} />
        },
      }}
      />
      <Tabs.Screen
      name="searchHazard"
      options={{
        title: 'Search',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
      }}
      />
      <Tabs.Screen
      name="reportHazard"
      options={{
        title: 'Report',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />,
      }}
      />
      <Tabs.Screen
      name="explore"
      options={{
        title: 'Login',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
      }}
      />
    </Tabs>
  );
}



/* DEBUGGING  - S
import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tab One',
        }}
      />
    </Tabs>
  );
}
DEBUGGING  - E */