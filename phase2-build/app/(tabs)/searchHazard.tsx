import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, SafeAreaView, TextInput, FlatList, Text, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../SessionContext'; // Access session context
import { useTheme } from '@/theme/ThemeContext'; // Access theme controls


// TODO 
// - Fix up faulty debug code design
// - Replace simulated FIRESTORE FUNCTIONS
// - Replace simulated ADDRESS SEARCH FUNCTIONS
// - Replace getting coordinates from ADDRESS PLACEHOLDER (line 110 ish)
// - Copy hazards near selected location to cache somehow for local offline storage as a list
// -- Ideally hazards within 100km of set location, depending on MAX quantity
// - Add option to search by coordinates
// - Add option to manually input address

/*
###################################################################
## -- HAZARD OBJECT GLOBAL TYPE DEF --                           ##
###################################################################
*/

// Hazard object data structure
type Hazard = {
  id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
};


/*
###################################################################
## -- FAKE EVENTS FOR DEBUGGING --                               ##
###################################################################
*/

const DEBUG_MODE = 1; // Set to 1 for debug mode, 0 for normal operation
const debugAddress = "14 Sutherland St Walgett NSW, AUSTRALIA";
const debugCoordinates = { latitude: -30.026042, longitude: 148.114295 };
const debugHazards: Hazard[] = [
  {
    id: 'debug1',
    type: 'Flood',
    description: 'Flooding reported near Walgett.',
    latitude: -30.025042,
    longitude: 148.115295,
  },
  {
    id: 'debug2',
    type: 'Fire',
    description: 'Bushfire reported near Walgett.',
    latitude: -30.027042,
    longitude: 148.113295,
  },
];


/*
###################################################################
## -- SEARCH PAGE EXPORT CORE FUNCTIONS --                       ##
###################################################################
*/

export default function SearchPage() {
  const { session } = useSession(); // Access session context for initial location
  const { theme } = useTheme(); // Access the current theme (light or dark)
  
  // Control of UseState Hooks
  const [currentLocation, setCurrentLocation] = useState<Region | null>(
    session.currentLocation 
      ? {
        ...session.currentLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
      : null
  );
  const [searchQuery, setSearchQuery] = useState(''); // For user search bar input
  const [hazards, setHazards] = useState<Hazard[]>([]); // List of hazards
  const [suggestions, setSuggestions] = useState<string[]>([]); // List for suggested addresses
  const [loading, setLoading] = useState(false);

  // Placeholder for Firestore hazard fetch
  const fetchHazards = async (location: Region): Promise<Hazard[]> => {
    console.log(`Fetching hazards near ${location.latitude}, ${location.longitude}`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    // Debugging - return fake values if in debug mode
    if (DEBUG_MODE === 1 && location.latitude === debugCoordinates.latitude && location.longitude === debugCoordinates.longitude) {
      console.log('Retrieving debug hazards');
      return debugHazards;
    }

    // REMOVE WHEN FIREBASE IS LIVE
    return [
      {
        id: '1',
        type: 'Fallen Tree',
        description: 'Bad luck, there is a simulated fallen tree here - FIRESTORE NOT YET IMPLEMENTED',
        latitude: location.latitude + 0.03,
        longitude: location.longitude + 0.05,
      },
      {
        id: '2',
        type: 'Fire',
        description: 'Simulated Bushfire reported nearby - FIRESTORE NOT YET IMPLEMENTED',
        latitude: location.latitude - 0.07,
        longitude: location.longitude - 0.07,
      },
    ];
  };

  // Placeholder for fetching address suggestions
  const fetchAddressSuggestions = async (query: string): Promise<string[]> => {
    console.log(`Fetching address suggestions for query: ${query}`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    return [
      `${query} Street, City A`,
      `${query} Avenue, City B`,
      `${query} Road, City C`,
    ];
  };

  // Handle update hazards based on the location
  const updateHazards = useCallback(async (location: Region) => {
    setLoading(true);
    try {
      const fetchedHazards = await fetchHazards(location);
      setHazards(fetchedHazards);
    } catch (e) {
      console.error('Error fetching hazards: ', e);
      Alert.alert('Error', 'Failed to fetch hazards.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Handle address selection from suggestions
  const handleAddressSelect = async (address: string) => {
    console.log(`Address selected: ${address}`);
    setSearchQuery(address);
    setSuggestions([]);

    // PLACEHOLDER Simulate fetching coordinates from the address 
    let selectedLocation: Region;

    if (DEBUG_MODE === 1 && address === debugAddress) {
      console.log('Using debug coordinates for address');
      selectedLocation = {
        latitude: debugCoordinates.latitude,
        longitude: debugCoordinates.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    } else {
      selectedLocation = {
        latitude: currentLocation?.latitude || 0,
        longitude: currentLocation?.longitude || 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    // Do the loading and setting business 
    setCurrentLocation(selectedLocation);
    updateHazards(selectedLocation);
  };

  // GET LOCATION
  useEffect(() => {
    if (currentLocation) {
      updateHazards(currentLocation); // First pass HAZARD load
    }
  }, [currentLocation, updateHazards]);

  /*
  ###################################################################
  ## -- THEME AND STYLING APPLICATION --                           ##
  ###################################################################
  */
  
  return (
    <SafeAreaView className="flex-1">
      {/* Title Bar */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Disaster Map</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchBarContainer} >
        <TextInput
          style={StyleSheet.searchInput}
          placeholder="Search by address or coordinates"
          placeholderTextColor={theme === 'dark' ? 'gray' : 'black'}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <Ionicons name="ellipsis-vertical" size={24} color={theme === 'dark' ? 'white' : 'black'} />
      </View>

      {/* MAP View Control */}
      <View style={styles.mapContainer}>
        <MapView
          className="flex-1"
          initialRegion={currentLocation || undefined}
          region={currentLocation || undefined}
          onRegionChangeComplete={(region) => setCurrentLocation(region)}
        >
          {/* HAZARDS DISPLAY */}
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

      {loading && <ActivityIndicator className="absolute top-1/2 left-1/2" size="large" />}
    </SafeAreaView>
  );

  // refactoring
  // DEBUG <<< START REMOVED
  /*
  const searchBarClasses = theme === 'dark'
    ? 'absolute top-12 left-4 right-4 z-10 bg-gray-800 text-white rounded-lg shadow p-3 flex-row items-center'
    : 'absolute top-12 left-4 right-4 z-10 bg-white text-black rounded-lg shadow p-3 flex-row items-center';

  return (
    <View className="flex-1">
 
      <View className={searchBarClasses}>
        <TextInput
          className="flex-1 mr-2"
          placeholder="Search by address or coordinates"
          placeholderTextColor={theme === 'dark' ? 'gray' : 'black'}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <Ionicons name="ellipsis-vertical" size={24} color={theme === 'dark' ? 'white' : 'black'} />
 
 
        {suggestions.length > 0 && (
          <FlatList
            className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow z-20"
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleAddressSelect(item)} className="p-3 border-b border-gray-200">
                <Text className="text-gray-700">{item}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
  
 
      <MapView
        className="flex-1"
        initialRegion={currentLocation || undefined}
        region={currentLocation || undefined}
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
  
      {loading && <ActivityIndicator className="absolute top-1/2 left-1/2" size="large" />}
    </View>
  );
  */
  // DEBUG <<< START REMOVED
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  titleContainer: { alignItems: 'center', marginTop: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: { flex: 1, marginRight: 10 },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingIndicator: { position: 'absolute', top: '50%', left: '50%' },
});

