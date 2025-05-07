import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For cache file handling when implemented

// the original settings file has been backed up as settings2.tsx as I'm messing about with this one with the NativeWind theming


// TODO
// - get current coordinates button
// - implement caching
// - compass button
// - clear app cache with appropriate warning
// - user terms / agreements visible like about
// - include application VERSION in about
// - include application warnings keys / explanation in ABOUT
// - logout button
// - generate local list of known events even if map can't load
// - delete account / delete identifiable data
// - SOME OF THESE CAN GO TO ADMIN PAGE IN THE FUTURE

/*
###################################################################
## -- CACHE FILE AND THEME CONDITION SETUP --                    ##
###################################################################
*/
const SETTINGS_KEY = "userAppSettings";

type UserSettings = {
  isDarkMode: boolean;
};

/*
###################################################################
## -- SCREEN STRUCTURE AND DATA SETUP --                         ##
###################################################################
*/
export default function Settings() {
  const { theme, setTheme } = useTheme(); // addedV2
  const [isAboutVisible, setIsAboutVisible] = useState(false); // existing
  const [isDark, setIsDark] = useState(theme === 'dark'); // Stores local dark mode state

  // Attempt to load settings from cache on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const cachedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        // if we get settings to look at
        if (cachedSettings) {
          const parsedSettings: UserSettings = JSON.parse(cachedSettings);
          setIsDark(parsedSettings.isDarkMode);
          setTheme(parsedSettings.isDarkMode ? 'dark' : 'light');
        }
      } catch (e) {
        // otherwise Default / fallback
        console.error('Failed to load settings from cache', e);
      }
    };

    // Do load now
    loadSettings();
  }, [setTheme]);

  // Attempt to save settings to cache whenever slider value changes
  const handleSaveSettings = async (newIsDark: boolean) => {
    try {
      // setup the params
      const newSettings: UserSettings = { isDarkMode : newIsDark };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    }
    catch (e) {
      console.error('Failed to save settings to cache', e);
    }
  };

  // About section toggle
  const toggleAbout = () => { setIsAboutVisible(!isAboutVisible); }; // existing

  // Dark mode toggle function
  const handleToggleDarkMode = (value: boolean) => {
    setIsDark(value);
    setTheme(value ? 'dark' : 'light');
    handleSaveSettings(value); // call the save settings steps
  }

  // Switch value is true if theme is 'dark' // addedV2
  //const isDark = theme === "dark"; // addedV2 // and now parked / moved lower actually

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "Back",
          headerTitle: "Disaster Map",
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'Roboto',
            color: 'black',
          },
        }}
      />
      <ScrollView contentContainerStyle={styles.pageContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.text, styles.robotoFont]}>Settings</Text>
        </View>
        
        {/* Dark Mode Control Slider */}
        <View className="flex items-centre justify-center my-4">
          <Text
            className="text-lg mb-4 text-black dark:text-white"
            style={styles.robotoFont}
          >
            Dark Mode: {isDark ? "On" : "Off"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={handleToggleDarkMode}
            thumbColor={isDark ? "#222" : "#eee"}
            trackColor={{ false: "#ccc", true: "#444" }}
          />
        </View>

        {/* About Button */}
        <TouchableOpacity style={styles.aboutButton} onPress={toggleAbout}>
          <Text style={styles.aboutButtonText}>About</Text>
        </TouchableOpacity>

        {/* About Content Section */}
        {isAboutVisible && (
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutText, styles.robotoFont]}>
              Disaster Map is a mobile application designed to provide real-time disaster information and assistance. Developed by the Group 2 team (Luke and Richard).
            </Text>
            <Text style={[styles.aboutText, styles.robotoFont]}>
              Affiliated Government Agencies: Anyone who wants to help with disaster management and response.
            </Text>
          </View>
        )}
        {/*
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
          <Text className="text-lg mb-4 text-black dark:text-white">
            Dark Mode: {isDark ? "On" : "Off"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? "dark" : "light")}
            thumbColor={isDark ? "#222" : "#eee"}
            trackColor={{ false: "#ccc", true: "#444" }}
          />
        </View>
        */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    //flex: 1,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white', // Can implement nativewind classes for darkmode if required
  },
  titleContainer: {
    //padding: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    //marginTop: 35,
    //fontFamily: 'Roboto',
  },
  aboutButton: {
    //marginTop: '100%',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    width: '50%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  aboutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    //fontFamily: 'Roboto',
  },
  aboutContent: {
    marginTop: 10,
    width: '85%',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    //fontFamily: 'Roboto',
  },
  robotoFont: {
    fontFamily: 'RobotoRegular', // Single line for font application
  }
});