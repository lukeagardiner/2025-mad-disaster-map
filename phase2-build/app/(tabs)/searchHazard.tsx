import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, TextInput, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, Pressable } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { useSession } from '../../SessionContext'; // Access session context
import { useTheme } from '@/theme/ThemeContext'; // Access theme controls
import { router } from 'expo-router';

/*
###################################################################
## -- DEBUG MODE AND CONSTANTS --                                ##
###################################################################
*/

const DEBUG_MODE = 1; // Set to 1 to enable debug mode, 0 for production mode
const NAVIGATION_MODE = 0;

// Default location (Brisbane, Australia)
const DEFAULT_REGION: Region = {
  latitude: -27.4698,
  longitude: 153.0251,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Test address and coordinates for debug mode
const debugAddress = "14 Sutherland St Walgett NSW, AUSTRALIA";
const debugCoordinates: Region = {
  latitude: -30.026042,
  longitude: 148.114295,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Hazard object data structure
type Hazard = {
  id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Simulated debug hazards
const debugHazards: Hazard[] = [
  {
    id: 'debug1',
    type: 'Flood',
    description: 'Flooding reported near debug location.',
    latitude: debugCoordinates.latitude + 0.01,
    longitude: debugCoordinates.longitude + 0.01,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  {
    id: 'debug2',
    type: 'Fire',
    description: 'Bushfire reported near debug location.',
    latitude: debugCoordinates.latitude - 0.01,
    longitude: debugCoordinates.longitude - 0.01,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
];

export default function SearchPage() {
  const { session } = useSession(); // Access session context for initial location
  const { theme } = useTheme(); // Access the current theme (light or dark)

  // State hooks
  const [currentLocation, setCurrentLocation] = useState<Region>(() => {
    if (session.currentLocation) {
      console.log('DEBUG: Initial location found in session:', session.currentLocation);
      return {
        ...session.currentLocation,
        latitudeDelta: session.currentLocation.latitudeDelta || 0.01, // Include default
        longitudeDelta: session.currentLocation.longitudeDelta || 0.01, // Include default
      };
    } else {
      console.warn('DEBUG: No session location found, using default location.');
      return DEFAULT_REGION;
    }
  });

  const [searchQuery, setSearchQuery] = useState(''); // User input for search
  const [hazards, setHazards] = useState<Hazard[]>([]); // Hazards to display
  const [loading, setLoading] = useState(false); // Loading state
  const [suggestions, setSuggestions] = useState<string[]>([]); // Address suggestions

  /*
  ###################################################################
  ## -- CORE FETCH FUNCTIONS --                                   ##
  ###################################################################
  */

  // Simulate fetching hazards
  const fetchHazards = async (location: Region): Promise<Hazard[]> => {
    if (DEBUG_MODE) {
      console.log(`DEBUG: Fetching hazards near ${location.latitude}, ${location.longitude}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    // Return debug hazards if in debug mode and using debug coordinates
    if (DEBUG_MODE && location.latitude === debugCoordinates.latitude && location.longitude === debugCoordinates.longitude) {
      console.log('DEBUG: Returning debug hazards for debug coordinates.');
      return debugHazards;
    }

    // Placeholder hazards (replace with Firestore fetch in production)
    return [
      {
        id: '1',
        type: 'Fallen Tree',
        description: 'Simulated fallen tree near this location.',
        latitude: location.latitude + 0.03,
        longitude: location.longitude + 0.05,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      {
        id: '2',
        type: 'Fire',
        description: 'Simulated bushfire near this location.',
        latitude: location.latitude - 0.07,
        longitude: location.longitude - 0.07,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
    ];
  };

  // Simulate fetching address suggestions
  const fetchAddressSuggestions = async (query: string): Promise<string[]> => {
    if (DEBUG_MODE) {
      console.log(`DEBUG: Fetching address suggestions for query: ${query}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay

    // Return debug address as a suggestion
    const baseSuggestions = [
      `${query} Street, City A`,
      `${query} Avenue, City B`,
      `${query} Road, City C`,
    ];

    // Always include the typed address as the 4th suggestion
    if (!baseSuggestions.includes(query)) {
      baseSuggestions.splice(3, 0, query);
    }

    return baseSuggestions;
  };

  /*
  ###################################################################
  ## -- HANDLERS AND EFFECTS --                                   ##
  ###################################################################
  */

  // Handle search query changes
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const fetchedSuggestions = await fetchAddressSuggestions(query);
      setSuggestions(fetchedSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle address selection
  const handleAddressSelect = async (address: string) => {
    console.log(`DEBUG: Address selected: ${address}`);
    setSearchQuery(address);
    setSuggestions([]);
    let selectedLocation: Region;

    if (address === debugAddress && DEBUG_MODE) {
      console.log('DEBUG: Using debug coordinates for selected address.');
      selectedLocation = debugCoordinates;
    } else {
      selectedLocation = currentLocation; // Replace with geocoding logic if needed
    }

    setCurrentLocation(selectedLocation);
    await updateHazards(selectedLocation);
  };

  // Trigger search when the search field loses focus
  const handleBlur = () => {
    if (searchQuery) {
      handleAddressSelect(searchQuery);
    }
  };

  // Show an alert for the three-dot menu (placeholder for future functionality)
  const handleMenuPress = () => {
    Alert.alert('Menu', 'Three-dot menu pressed.');
  };

  // Handle hazards update
  const updateHazards = useCallback(async (location: Region) => {
    setLoading(true);
    try {
      const fetchedHazards = await fetchHazards(location);
      setHazards(fetchedHazards);
      console.log('DEBUG: Hazards updated:', fetchedHazards);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch hazards.');
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  ###################################################################
  ## -- COMPONENT RENDERING --                                    ##
  ###################################################################
  */

  return (
    <View style={styles.pageContainer}>
          {/*Settings Button*/}
          <Pressable
            onPress={() => {
              console.log('Navigating to settings'); // Debug: Log navigation
              router.push('/settings'); // Navigate to settings page
            }}
            style={styles.settingsButton}
          >
            <Ionicons name="settings" size={24} color="black" />
          </Pressable>
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
        <SafeAreaView style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Disaster Map</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by address or coordinates"
              placeholderTextColor={theme === 'dark' ? 'gray' : 'black'}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onBlur={handleBlur}
            />
            {/* Clear Button */}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSuggestions([]); // Clear suggestions when clearing the input
              }} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            )}
            {/* Three-dot menu */}
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={theme === 'dark' ? 'white' : 'black'}
              onPress={handleMenuPress} // Trigger the menu action
              style={styles.menuIcon}
            />
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleAddressSelect(item)} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              showsUserLocation={true}
              followsUserLocation={NAVIGATION_MODE ? true : false}
              region={currentLocation} // Dynamically update the map region
              onRegionChangeComplete={(region) => setCurrentLocation(region)}
            >
              {hazards.map((hazard) => (
                <Marker
                  key={hazard.id}
                  coordinate={{ latitude: hazard.latitude, longitude: hazard.longitude }}
                  title={hazard.type}
                  description={hazard.description}
                />
              ))}
            </MapView>
          </View>

          {/* Loading Indicator */}
          {loading && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
        </SafeAreaView>
    </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%', padding: 5},
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    marginTop: '2%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    color: 'black',
  },
  menuIcon: {
    marginLeft: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
  },
  suggestionText: {
    fontSize: 16,
    color: 'black',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  titleContainer: {
    padding: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    //fontFamily: 'Roboto',
  },
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
  clearButton: {
    marginHorizontal: 5,
  },
});