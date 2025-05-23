import { StyleSheet, Platform, View, TouchableWithoutFeedback, Keyboard, Text, TextInput,
  KeyboardAvoidingView, TouchableOpacity, Pressable, FlexAlignType } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useSession } from '../../SessionContext';
import { initializeApp, FirebaseError } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut,
  initializeAuth } from "firebase/auth";
import { app } from '../../firebase.js';
import '../../firebase.js'; // Import Firebase configuration
import { set } from 'lodash';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Need to install npm install firebase
// PASSWORD is erroring out -
// FORGOT PASSWORD screen link
// Add a transaction table and I'll add a globalist table to the db
// Needs session logic - secure token - auth token that we generate and clear at logout...
// firebase needs this or at least we need to build future capacity for this behaviour
// Needs better onscreen feedback or a loading behaviour after button press to stop multiple press
// Better feedback is already registered or registration successful

const {firebaseConfig} = require('../../firebase.js'); // Import Firebase configuration
const db = getFirestore(app); // Firestore instance

const INITIAL_EMAIL = ''; // Initial email state
const INITIAL_ERROR = ''; // Initial error state

/*
###################################################################
## -- PAGE AND EVENT LOGIC --                                    ##
###################################################################
*/

export default function LoginScreen() {
  const { theme } = useTheme();
  const { session, updateSession, clearSession} = useSession();
  const app = initializeApp(firebaseConfig);
  //const analytics = getAnalytics(app);
  const auth = getAuth(app); // Initialize Firebase Authentication
  const [loginout, setLoginout] = useState(false); // State to track login/logout status
  const [signup, setSignup] = useState(false); // State to track sign-up status
  const [pword, setPword] = useState(''); // State to track password input
  const [email, setEmail] = useState(INITIAL_EMAIL); //State to track email input
  const [error, setError] = useState(INITIAL_ERROR);
  const MAX_LENGTH = 50;

  /// Function to validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /// Function to handle email input changes and validation
  const handleEmailChange = (email: string) => {
    setEmail(email); 
    // Validate email format and length
    if (email.length > MAX_LENGTH) {
      setError(`Email exceeded ${MAX_LENGTH} characters`);
      return;
    }
    // Check if email is valid
    if (!validateEmail(email) && email.length > 0) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };
  /// Function to handle login button press
  const handleLogin = () => {
    if (error === '' && email !== '') {
      console.log('Email submitted for login:', email);
      setEmail(email);
      setPword(pword);
      setLoginout(true);
      signInWithEmailAndPassword(auth, email, pword)
        .then(async(userCredential) => { // Sign in successful
          const user = userCredential.user; // Get user information
          console.log('User logged in:', user); // Debug: Log user information
          // Retrieve Firestore data
          const userDoc = doc(db, 'user', user.uid);
          const userSnapshot = await getDoc(userDoc);

          let accountType = null;
          let active = null;

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            accountType = userData.accountType || null;
            active = userData.active || null;

            // Debug logs for Firestore fields
            console.log('DEBUG: Firestore accountType:', accountType);
            console.log('DEBUG: Firestore active:', active);

            if (active === 0) {
              throw new Error('Your account is inactive. Please contact support.');
            }
          } else {
            console.log('No Firestore document found for this user.');
          }

          // push this to session to update object
          updateSession ({
            type: 'authenticated',
            sessionStartTime: new Date().toISOString(),
            expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour expiry
            accountType,
            active,
            uid: user.uid,
          });
          setLoginout(true);
          <Text>Login successful</Text>;
          if (accountType === 1 ) {
            router.push('/(tabs)');
          }
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log('Error signing in:', errorCode + " " + errorMessage);
          setError(errorMessage);
        });
    } else {
      console.log('Invalid email or error present');
    }
  };

  /// Function to handle sign-up button press
  const handleSignUp = async() => {
    if (error === '' && email !== '') {
      console.log('Email submitted for sign up:', email);
      try {
        // Attempts to create user with firebase auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pword)
        const user = userCredential.user
        console.log('User creation successful: ', user);

        // Add user to Firestore
        const userDoc = doc(db, 'user', user.uid);
        const userData = {
          accountType: 1,
          active: 1,
          //createdAt: new Date().toISOString(),
        };
        await setDoc(userDoc, userData);

        console.log('DEBUG: User added to Firestore with data:', userData);

        // Need to also set this in the session
        updateSession({
          type: 'authenticated',
          sessionStartTime: new Date().toISOString(),
          expiry: new Date(Date.now() + 3600 * 1000).toISOString(), //  Sets expiry for 1 hour into the future
          accountType: userData.accountType,
          active: userData.active,
          uid: user.uid,
        });

        // Display success popup
        setSignup(true);

      }
      catch (error) {
        // Firebase object/app specific errors
        if (error instanceof FirebaseError) {
          const errorCode = error.code; 
          const errorMessage = error.message; 
        console.log('Error creating user:', errorCode + " " + errorMessage);
        setError(errorMessage);
        }
        else {
          console.log('Unexpected error:', error);
          setError('An unexpected error occurred. Please try again.');
        }
      }       
    } else {
      console.log('Invalid email or error present');
    }
  };

  // Function to handle logout button on press
  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearSession();
      setEmail(INITIAL_EMAIL);
      setPword('');
      setError(INITIAL_ERROR);
      setLoginout(false);
      router.push('/'); // Navigate to login page
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Logout failed. Please try again.');
    }
  };

  /// Makes sure the popup button behaves after register then pushes user to index or home
  const handleDismissSignupPopup = async() => {
    setSignup(false);
    router.push('/');
  };

  /*
  ###################################################################
  ## -- PRESENTATION / UI --                                       ##
  ###################################################################
  */
  console.log('Session Type:', session.type);

  return (
    <View style={[styles.pageContainer, { backgroundColor : theme === 'dark' ? '#000000' : '#fff'}]}>
      {/*Settings Button*/}
      <Pressable
        onPress={() => {
          console.log('Navigating to settings');
          router.push('/settings');
        }}
        style={styles.settingsButton}>
        <Ionicons name="settings" size={24} color={theme === 'dark' ? '#fff' : '#000000'} />
      </Pressable>
      
      {/* Popup for Registration Success */}
      {signup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupText}>Registration successful! User logged in.</Text>
            <TouchableOpacity
              style={styles.buttonPopupClose}
              onPress={handleDismissSignupPopup} // Hide the popup when dismissed
            >
              <Text style={styles.popupCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Keyboard Avoiding View */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}> 
        {/*TouchableWithoutFeedback to dismiss keyboard when tapping outside of TextInput*/}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}> 
          <View style={{ flex: 1 }}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000'}]}>Disaster Map</Text>
              <Text style={[styles.text, { color: theme === 'dark' ? '#ddd' : '#333'}]}>Login or Sign up Today!</Text>
            </View>
            <View style={styles.emailContainer}>
              {/* Email and Password Fields */}
              {session.type === 'unauthenticated' && (
                <>
                  <TextInput
                    style={[styles.emailInput, { backgroundColor : theme === 'dark' ? '#C1C1D7' : '#fff' }]}
                    placeholder="Email Address"
                    placeholderTextColor={theme === 'dark' ? '#fff' : '#555'}
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput 
                    style={[styles.emailInput, { backgroundColor : theme === 'dark' ? '#C1C1D7' : '#fff' }]}
                    placeholder="Password"
                    placeholderTextColor={theme === 'dark' ? '#fff' : '#555'}
                    value={pword}
                    onChangeText={setPword}
                    secureTextEntry={true} // Secure text entry for password input
                    autoCapitalize="none"
                  />
                </>
              )}
              {/*Login Button */}
              <View style={styles.loginButtons}>
                {/* LOGIN */}
                {session.type === 'unauthenticated' && (
                  <TouchableOpacity
                    /// Login button with conditional styling based on error and email state
                    /// If error is present or email is empty, button is disabled and greyed out #3385FF
                    style ={[
                      styles.button,
                      {
                        backgroundColor:
                          error !== '' || email === ''
                            ? theme === 'dark'
                              ? '#000000' // Dark mode with field error
                              : '#C1C1D7' // Light mode with field error
                            : theme === 'dark'
                              ? '#C1C1D7' // Dark mode when no error and email is valid
                              : '#3385FF', // Light mode when no error and email is valid
                        borderColor:
                          error !== '' || email === ''
                            ? theme === 'dark' // Grey outline in dark mode if field error
                              ? '#808080' // border colour
                              : 'transparent' // otherwise transparent
                            : 'transparent', // also otherwise transparent
                        borderWidth:
                          error !== '' || email === ''
                            ? theme === 'dark' 
                              ? 1 // Slight outline in dark mode when text fields are empty
                              : 0 // No outline in light mode
                            : 0, // No outline when text fields are valid
                      },
                    ]}
                    onPress={handleLogin}
                    disabled={error !== '' || email === ''} 
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>
                )}
                {/* SIGN UP / REGISTER */}
                {session.type === 'unauthenticated' && (
                  <TouchableOpacity
                    style ={[
                      styles.button,
                      {
                        backgroundColor:
                          error !== '' || email === ''
                            ? theme === 'dark'
                              ? '#000000' // Dark mode with field error
                              : '#C1C1D7' // Light mode with field error
                            : theme === 'dark'
                              ? '#C1C1D7' // Dark mode when no error and email is valid
                              : '#3385FF', // Light mode when no error and email is valid
                        borderColor:
                          error !== '' || email === ''
                            ? theme === 'dark' // Grey outline in dark mode if field error
                              ? '#808080' // border colour
                              : 'transparent' // otherwise transparent
                            : 'transparent', // also otherwise transparent
                        borderWidth:
                          error !== '' || email === ''
                            ? theme === 'dark' 
                              ? 1 // Slight outline in dark mode when text fields are empty
                              : 0 // No outline in light mode
                            : 0, // No outline when text fields are valid
                      },
                    ]}
                    onPress={handleSignUp}
                    disabled={error !== '' || email === ''}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Sign Up</Text>
                  </TouchableOpacity>
                )}

              </View>
              {/* FORGOT PASSWORD LINK */}
              <TouchableOpacity onPress={() => router.push('/resetPw')}>
                <Text style={[styles.linkText, { color: theme === 'dark' ? '#1E90FF' : '#3385FF' }]}>
                  Reset/Forgot Password
                </Text>
              </TouchableOpacity>
              {/* LOGOUT BUTTON */}
              {session.type === 'authenticated' && (
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={[styles.buttonLogout, { backgroundColor: '#FF6347' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Logout</Text>
                  </TouchableOpacity>
              )}
              {/* ADMIN BUTTON - Add this code right after the logout button */}
              {session.type === 'authenticated' && (session.accountType ?? 0) > 1  && session.active === 1 && (
                <TouchableOpacity
                  onPress={() => router.push('/admin')}
                  style={[styles.buttonLogout, { backgroundColor: '#4682B4', marginTop: 10 }]}
                  activeOpacity={0.8}
                >
                 <Text style={styles.buttonText}>Enter Admin</Text>
                </TouchableOpacity>
              )}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

/*
###################################################################
## -- CSS - STYLING --                                           ##
###################################################################
*/

const buttonBase = {
  marginHorizontal: 5,
  paddingVertical: 12,
  alignItems: 'center' as FlexAlignType,
  borderRadius: 8,
  marginVertical: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 5,
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
  },
  titleContainer: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'Black',
  },
  text: {
    fontSize: 20,
    minHeight: 40,
    paddingVertical: 10,
    marginTop: 45,
  },
  emailContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  emailInput: {
    height: 40,
    width: '75%',
    borderColor: '#000',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginLeft: '5%',
    borderRadius: 5,
    marginTop: 2
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    marginLeft: 20,
  },
  loginButtons: {
    marginTop: 20,
    width: '60%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoutButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    ...buttonBase,
  },
  buttonLogout: {
    width: '60%',
    alignSelf: 'center',
    ...buttonBase,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    textDecorationLine: 'underline',
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
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
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
  robotoFont: {
      fontFamily: 'RobotoRegular',
  },
});