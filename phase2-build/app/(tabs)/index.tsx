import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, Pressable } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';

export default function Index() {
  const [location, setLocation] = useState<Region | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getCurrentLocation() {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const {
        coords: { latitude, longitude },
      } = await Location.getCurrentPositionAsync({});

    setLocation({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setLoading(false);
  };
  getCurrentLocation();
}, []);

  let text = 'Waiting...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.wrapper}>
      {/*Settings Button*/}
      <Pressable
        onPress={() => router.push('/settings')}
        style={styles.settingsButton}
      >
        <Ionicons name="settings" size={24} color="black" />
      </Pressable>

      {/*Main Title*/}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Disaster Map</Text>
      </View>

      {/*Map*/}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          onMapReady={() => console.log('Map is ready')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  titleContainer: {
    padding: 10, // Adds padding around the title
    alignItems: 'center', // Centers the title horizontally
    marginTop: 45,
  },
  title: {
    fontSize: 24, // Larger font size for the title
    fontWeight: 'bold', // Makes the title bold
    color: 'black', // White color for the title
  },
  mapContainer: {
    flex: 1, // Takes the remaining space after the title
  },
  map: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
  }
});