import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { Stack, SplashScreen } from 'expo-router';
import * as Font from 'expo-font';
import { View } from 'react-native';
import { useEffect, useState, ReactNode } from 'react';

type ThemedRootProps = {
  children: ReactNode;
};

function ThemedRoot({ children }: ThemedRootProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#000' : '#fff' }}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();

    const loadFonts = async () => {
      await Font.loadAsync({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        NunitoRegular: require('../assets/fonts/Nunito-Regular.ttf'),
        RobotoRegular: require('../assets/fonts/Roboto-Regular.ttf'),
      });

      setLoaded(true);
      SplashScreen.hideAsync();
    };

    loadFonts();
  }, []);

  if (!loaded) {
    return null; // Show nothing while loading fonts
  }

  return (
    <ThemeProvider>
      <ThemedRoot>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="settings" />
        </Stack>
      </ThemedRoot>
    </ThemeProvider>
  );
}