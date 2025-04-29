
// import MaterialIcons from '@expo/vector-icons/MaterialIcons'; //--remove
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme'; // existing -- should be able to remove this
import { useTheme } from '@/theme/ThemeContext';  // addedV2

export default function TabLayout() {
  
  // Icon Colour and Tab Background Colour rules using the THEME logic
  //const colorScheme = useColorScheme(); // existing -- should be able to remove this
  const { theme } = useTheme(); // addedV2

  // Icon Colour based on Theme
  const iconColor = theme === 'dark'
    ? Colors.dark.icon
    : Colors.light.icon;

  // Tab Background Colour based on Theme
  const tabBarBackgroundColor = theme === 'dark'
    ? Colors.dark.icon
    : Colors.light.icon;
  
  return (
    <Tabs
      screenOptions={{
      // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,  // existing - should be able to remove this
      tabBarActiveTintColor: Colors[theme ?? 'light'].tint,  // addedV2
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarBackground: () => <TabBarBackground />,
      //tabBarBackground: TabBarBackground, // existing - should be able to remove this
      /*
      tabBarBackground: () => (
        <TabBarBackground backgroundColor={tabBarBackgroundColor} />
      ),
      */
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
        tabBarIcon: () => (
          <IconSymbol size={28} name="house.fill" color={iconColor} />
        ),
      }}
      />
      <Tabs.Screen
      name="searchHazard"
      options={{
        title: 'Search',
        //tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        tabBarIcon: () => (
          <IconSymbol size={28} name="magnifyingglass" color={iconColor} />
        ),
      }}
      />
      <Tabs.Screen
      name="reportHazard"
      options={{
        title: 'Report',
        //tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />,
        tabBarIcon: () => (
          <IconSymbol size={28} name="exclamationmark.triangle.fill" color={iconColor} />
        ),
      }}
      />
      <Tabs.Screen
      name="loginRegister"
      options={{
        title: 'Login',
        //tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        tabBarIcon: () => (
          <IconSymbol size={28} name="person" color={iconColor} />
        ),
      }}
      />
    </Tabs>
  );
}
