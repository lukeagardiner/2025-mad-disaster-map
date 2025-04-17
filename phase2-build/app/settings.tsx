import { Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function Settings() {
  const [isAboutVisible, setIsAboutVisible] = useState(false);

  const toggleAbout = () => {
    setIsAboutVisible(!isAboutVisible);
  };

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
      <View style={styles.titleContainer}>
        <Text style={styles.text}>Settings</Text>
        <TouchableOpacity style={styles.aboutButton} onPress={toggleAbout}>
          <Text style={styles.aboutButtonText}>About</Text>
        </TouchableOpacity>
        {isAboutVisible && (
          <View style={styles.aboutContent}>
            <Text style={styles.aboutText}>
              Disaster Map is a mobile application designed to provide real-time disaster information and assistance. Developed by the Group 2 team (Luke and Richard).
            </Text>
            <Text style={styles.aboutText}>
              Affiliated Government Agencies: Anyone who wants to help with disaster management and response.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  titleContainer: {
    padding: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    marginTop: 35,
    fontFamily: 'Roboto',
  },
  aboutButton: {
    marginTop: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    width: '75%',
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
    fontFamily: 'Roboto',
  },
  aboutContent: {
    marginTop: 5,
    width: '75%',
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
    fontFamily: 'Roboto',
  },
});