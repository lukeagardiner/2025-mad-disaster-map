import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView from 'react-native-maps';

export default function Index() {
  console.log('Rendering Index component');
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Disaster Map</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
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
    backgroundColor: '#d3d3d3', // Optional: Adds a background color to make the header stand out
  },
  title: {
    fontSize: 24, // Larger font size for the title
    fontWeight: 'bold', // Makes the title bold
    color: '#ffffff', // White color for the title
  },
  mapContainer: {
    flex: 1, // Takes the remaining space after the title
  },
  map: {
    width: '100%',
    height: '100%',
    marginTop: 0, // 15-unit gap at the top of the map
  },
});