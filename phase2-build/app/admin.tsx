import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext'; 
import { useSession } from '../SessionContext'; 
import { app } from '../firebase.js'; // Firebase app initialization
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';


// broadcast message - in app messaging - firebase
// extra features for registered users+
// reporting page - direct edit and global changes -- linked to global messaging -- in app messaging
// light mode dark mode - maps + screens
// refactoring - coding style and commenting
// add apply to be verified user button in settings
// verified user can add a comment on the event that gets broadcast to subscribers
// move geomapping geo secret out of search hazard
// manager promotion to admin user - can request in settings with an authcode
// include contact us button in settings... with a ticket-log function sort of thing
// add USER type supports in firebase - and user status
// -- 1 should be public user... 2 should be org user... 3 should be godmode
// -- active - 0 = inactive, 1 = active, 2 = suspended, 3= banned
// add report user.... in event detail
// add subscribe to event in event detail to receive broadcasts
// marker on search page to show searched location
// in the firestore... might just need to check the disabled property for the user too as well as the custom one

// TODO - Add org accounts
// 1. Master user for account is signed in > add individual user accounts or import user account list of existing users ... csv?
// 2. User account being added must be pre-existing
// 3. Process requests for verified account from settings.tsx


// Placeholder constants
const INITIAL_EMAIL = '';
const INITIAL_ERROR = '';

export default function BasicAccountManager() {
  const { theme } = useTheme(); // Access theme for dark mode
  const { session } = useSession(); // Access session context
  const auth = getAuth(app); // Firebase Authentication

  const [email, setEmail] = useState(INITIAL_EMAIL);
  const [error, setError] = useState(INITIAL_ERROR);
  const MAX_LENGTH = 50; // Max email length

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input changes
  const handleEmailChange = (email: string) => {
    setEmail(email);
    if (email.length > MAX_LENGTH) {
      setError(`Email exceeded ${MAX_LENGTH} characters`);
      return;
    }
    if (!validateEmail(email) && email.length > 0) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
      <Pressable
        onPress={() => {
          console.log('Navigating to settings');
          router.push('/settings');
        }}
        style={styles.settingsButton}
      >
        <Ionicons name="settings" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>Basic Account Manager</Text>
            
            {/* Email Input Field */}
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#C1C1D7' : '#fff' }]}
              placeholder="Email Address"
              placeholderTextColor={theme === 'dark' ? '#fff' : '#555'}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Placeholder Button */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: error !== '' || email === '' ? '#C1C1D7' : '#3385FF',
                },
              ]}
              disabled={error !== '' || email === ''}
            >
              <Text style={styles.buttonText}>Placeholder Action</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});