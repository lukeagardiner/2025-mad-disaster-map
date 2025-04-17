import { StyleSheet, Platform, View, TouchableWithoutFeedback, Keyboard, Text, TextInput, KeyboardAvoidingView, TouchableOpacity, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_EMAIL = ''; // Initial email state
const INITIAL_ERROR = ''; // Initial error state

export default function LoginScreen() {
  const [email, setEmail] = useState(INITIAL_EMAIL);
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
      // TODO: Add Firebase login logic here
    } else {
      console.log('Invalid email or error present');
    }
  };
  /// Function to handle sign-up button press
  const handleSignUp = async() => {
    if (error === '' && email !== '') {
      console.log('Email submitted for sign up:', email);
      // TODO: Add Firebase sign-up logic here
    } else {
      console.log('Invalid email or error present');
    }
  };

  return (
    <View style={styles.pageContainer}>
      {/*Settings Button*/}
      <Pressable
        onPress={() => {
          console.log('Navigating to settings'); // Debug: Log navigation
          router.push('/settings'); // Navigate to settings page
        }}
        style={styles.settingsButton}>
        <Ionicons name="settings" size={24} color="black" />
      </Pressable>
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      //KeyboardAvoidingView to adjust view when keyboard is open
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}> 
      {/*TouchableWithoutFeedback to dismiss keyboard when tapping outside of TextInput*/}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}> 
        <View style={{ flex: 1 }}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Disaster Map</Text>
            <Text style={styles.text}>Login or Sign up Today!</Text>
          </View>
          <View style={styles.emailContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Email Address"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.loginButtons}>
              <TouchableOpacity
              /// Login button with conditional styling based on error and email state
                /// If error is present or email is empty, button is disabled and greyed out
                style={[styles.button, {backgroundColor: error !== '' || email === '' ? '#B0C4DE' : '#007BFF'}]} 
                onPress={handleLogin}
                disabled={error !== '' || email === ''} 
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28A745' }]}
                onPress={handleSignUp}
                disabled={error !== '' || email === ''}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
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
    top: 50,
    left: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
  },
  titleContainer: {
    marginTop: 47,
    padding: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'Black',
    fontFamily: 'Roboto',
  },
  text: {
    fontSize: 20,
    minHeight: 40,
    paddingVertical: 10,
    marginTop: 45,
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    marginLeft: 20,
    fontFamily: 'Roboto',
  },
  loginButtons: {
    marginTop: 20,
    width: '75%',
    alignItems: 'center',
  },
  button: {
    width: '65%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});