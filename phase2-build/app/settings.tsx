import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView, TextInput, 
  Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For cache file handling when implemented
import { useSession } from '../SessionContext';
import { doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebase'; 

// TODO
// - get current coordinates button
// - implement caching
// - compass button
// - clear app cache with appropriate warning
// - user terms / agreements visible like about
// - include application VERSION in about
// - include application warnings keys / explanation in ABOUT
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
## -- PAGE AND EVENT LOGIC --                                    ##
###################################################################
*/
export default function Settings() {
  const { theme, setTheme } = useTheme(); 
  const { session } = useSession();
  const db = getFirestore(app);
  const [isAboutVisible, setIsAboutVisible] = useState(false); 
  const [isTermVisible, setIsTermVisible] = useState(false); 
  const [isDark, setIsDark] = useState(theme === 'dark'); // Stores local dark mode state
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationVisible, setIsVerificationVisible] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false); // to track change activity
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // also in reportHazard

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
  const toggleTerms = () => { setIsTermVisible(!isTermVisible); }; // existing

  // Dark mode toggle function
  const handleToggleDarkMode = (value: boolean) => {
    setIsDark(value);
    setTheme(value ? 'dark' : 'light');
    handleSaveSettings(value); // call the save settings steps
  }
  
  // Mechanism for our user verificaion probs
  const handleBecomeVerified = () => {
    setShowVerificationPopup(true);
  };

  // This handles popup action
  const handleDismissVerificationPopup = () => {
    setShowVerificationPopup(false);
    setIsVerificationVisible(true); // Show the verification code input field
  };

  // And this is the submission logic based on... admin.tsx stuff
  const handleVerificationSubmit = async () => {
    if (verificationCode === '1') {
      try {
        if (!session.uid) {
          // Errors here if we don't make sure userId is not empty
          throw new Error('Could not populate User ID from session.');
        }

        // Should upgrade the account
        setIsProcessing(true);
        const userDoc = doc(db, 'user', session.uid); 
        await updateDoc(userDoc, { accountType: 3 }); 

        // confirm the change from firebase
        const updatedDoc = await getDoc(userDoc);
        const updatedData = updatedDoc.data();
        if (updatedData?.accountType === 3) {
          setShowSuccessPopup(true);
        }
        else {
          throw new Error('Failed to update account type in Firestore.');
        }
        //Alert.alert('Success', 'Your account is now verified!');
        //setIsVerificationVisible(false); // Hides the verification input
      } catch (error) {
        console.error('Failed to update account type:', error);
        Alert.alert('Error', 'Failed to verify account. Please try again.');
      }
      finally {
        setIsProcessing(false);
      }
    } else {
      Alert.alert('Error', 'Invalid verification code. Please type "1".');
    }
  };
  
  const handleSuccessPopupDismiss = () => {
    setShowSuccessPopup(false); 
    setIsVerificationVisible(false); 
  };


  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "Back",
          headerTintColor: theme === 'dark' ? '#fff' : '#333',
          headerTitle: "Disaster Map",
          headerStyle: {
            backgroundColor: theme === 'dark' ? '#121212' : '#FFFFFF',
          },
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'Roboto',
            color: theme === 'dark' ? '#fff' : '#333',
          },
        }}
      />
      <ScrollView contentContainerStyle={[
        styles.pageContainer,
        { backgroundColor: theme === 'dark' ? '#121212' : '#FFFFFF' },
      ]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.text, styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}>Settings</Text>
        </View>
        
        {/* Dark Mode Control Slider */}
        <View className="flex items-centre justify-center my-4">
          <Text
            className="text-lg mb-4 text-black dark:text-white"
            style={[styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}
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
          <View style={[
            styles.aboutContent,
            {backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#333' : '#ddd',
            }
          ]}>
            <Text style={[styles.aboutText, styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}> {/* Toggles font color for  dark mode */}
              Disaster Map is a mobile application designed to provide real-time disaster information and assistance. Developed by the Group 2 team (Luke and Richard).
            </Text>
            <Text style={[styles.aboutText, styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}>
              Affiliated Government Agencies: Anyone who wants to help with disaster management and response.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.aboutButton} onPress={toggleTerms}>
          <Text style={styles.aboutButtonText}>Terms / Agreements</Text>
        </TouchableOpacity>
        {/* Terms / Agreements Content Section */}
        {isTermVisible && (
          <View style={[
            styles.aboutContent,
            {backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#333' : '#ddd',
            }
          ]}>
            <Text style={[styles.aboutText, styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}>
              This section would outline the terms set out by the developers in a production environment.
            </Text>
            <Text style={[styles.aboutText, styles.robotoFont, { color: theme === 'dark' ? '#fff' : '#333' }]}>
              This section would outline the agreements set out by the developers in a production environment.
            </Text>
          </View>
        )}
        {/* Become Verified User Button -- must protect user from being 0*/}
        {session.type === 'authenticated' && (session.accountType ?? 0) < 4 && (
          <TouchableOpacity
            style={[styles.aboutButton, { backgroundColor: '#007BFF' }]}
            onPress={handleBecomeVerified}
          >
            <Text style={styles.aboutButtonText}>Become Verified User</Text>
          </TouchableOpacity>
        )}

        {/* Verification Pop-Up */}
        {showVerificationPopup && (
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.popupText}>You will receive an email with instructions on how to apply for account verification.</Text>
              <TouchableOpacity
                style={styles.buttonPopupClose}
                onPress={handleDismissVerificationPopup}
              >
                <Text style={styles.popupCloseText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Verification Code Input */}
        {isVerificationVisible && (
          <View style={styles.verificationContainer}>
            <TextInput
              style={styles.verificationInput}
              placeholder="Verification Code - Type '1'"
              placeholderTextColor="#888"
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
            <TouchableOpacity
              style={[styles.aboutButton, { backgroundColor: '#007BFF' }]}
              onPress={handleVerificationSubmit}
            >
              <Text style={styles.aboutButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Processing Popup */}
        {isProcessing && (
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.popupText}>Making those changes...</Text>
            </View>
          </View>
        )}
        {/* Success Popup */}
        {showSuccessPopup && (
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.popupText}>Change successful!</Text>
              <TouchableOpacity
                style={styles.buttonPopupClose}
                onPress={handleSuccessPopupDismiss}
              >
                <Text style={styles.popupCloseText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white', // Can implement native wind classes for dark mode if required
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
  aboutButton: {
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
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  popupText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonPopupClose: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#3385FF',
    borderRadius: 5,
  },
  popupCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verificationContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '85%',
  },
  verificationInput: {
    height: 40,
    width: '100%',
    borderColor: '#000',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  robotoFont: {
    fontFamily: 'RobotoRegular',
  }
});