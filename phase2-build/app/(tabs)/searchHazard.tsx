import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, SafeAreaView, TextInput, Text, ActivityIndicator,
  FlatList, TouchableOpacity, Alert, TouchableWithoutFeedback, Keyboard, Pressable
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { useSession } from '../../SessionContext'; // Access session context
import { useTheme } from '@/theme/ThemeContext'; // Access theme controls
import { router } from 'expo-router';
import { collection, getDocs, getFirestore, Timestamp, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase';

// Initialize Firebase app and Firestore
const app=initializeApp(firebaseConfig); // Initialize Firebase app
const db = getFirestore(); // Initialize Firestore instance once
const GEOAPIFY_API_KEY = '9bf2f555990c4aa384b93daa6dd23757'; // API key for geocoding service
/*
###################################################################
## -- DEBUG MODE AND CONSTANTS --                                ##
###################################################################
*/

const DEBUG_MODE = 0; // Set to 1 to enable debug mode, 0 for production mode
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
  rating: string;
  description: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  upvotes?: number;
  downvotes?: number;
};

// Simulated debug hazards
/*const debugHazards: Hazard[] = [
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
];*/

export default function SearchPage() {
  const { session, updateSession } = useSession(); // Access session context for initial location
  const { theme } = useTheme();
  const styles = getStyles(theme); // Get styles based on the current theme

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

  const [searchLocation, setSearchLocation] = useState<Region | null>(null); // NEW: State for searched location
  const [searchQuery, setSearchQuery] = useState(''); // User input for search
  const [hazards, setHazards] = useState<Hazard[]>([]); // Hazards to display
  const [loading, setLoading] = useState(false); // Loading state
  const [suggestions, setSuggestions] = useState<string[]>([]); // Address suggestions
  const mapRef = React.useRef<MapView>(null); // Reference to the map view

  /*
  ###################################################################
  ## -- CORE FETCH + UPDATE FUNCTIONS --                                   ##
  ###################################################################
  */

  const fetchHazards = async (region: Region): Promise<Hazard[]> => {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const hazardsQuery = query(
        collection(db, 'hazards'),
        where('timestamp', '>=', threeDaysAgo),
        where('downvotes', '<=', 5)
      );
      const querySnapshot = await getDocs(hazardsQuery);
      const hazardList: Hazard[] = [];

      // Log to verify the number of hazards returning is correct from firestore
      console.log(`Fetched ${querySnapshot.size} hazards from Firestore`);

      // Iterate through each document and log its data
      querySnapshot.forEach((doc) => {
        console.log(`Document ID: ${doc.id}`);
        console.log('Document Data:', doc.data()); // Logs the actual document data
        const data = doc.data();
        const location = data.location;

        if (
          location &&
          typeof location.latitude === 'number' &&
          typeof location.longitude === 'number' &&
          typeof data.hazard === 'string' &&
          typeof data.description === 'string'
        ) {
          hazardList.push({
            id: doc.id,
            type: data.hazard,
            rating: data.rating,
            description: data.description,
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            upvotes: data.upvotes,
            downvotes: data.downvotes
          });
        } else {
          console.log(`Invalid data in document ${doc.id}`);
        }
      });

      return hazardList;
    } catch (error) {
      console.error('Error fetching hazards from Firestore:', error);
      Alert.alert('Error', 'Failed to fetch hazards from Firestore.');
      return [];
    }
  };

  // Fetch address suggestions from Geoapify API
  const fetchAddressSuggestions = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&filter=countrycode:au&format=json&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results.map((result: any) => result.formatted);
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };
  // Debounce the fetchAddressSuggestions function to limit API calls
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query: string) => {
      const fetchedSuggestions = await fetchAddressSuggestions(query);
      setSuggestions(fetchedSuggestions);
    }, 300),
    []
  );
    // Geocode address to get coordinates
  const geocodeAddress = async (address: string): Promise<Region | null> => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&filter=countrycode:au&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const { lat, lon } = data.features[0].properties;
        return {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      } else {
        Alert.alert('Address not found', 'Unable to geocode the selected address.');
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to geocode the address.');
      return null;
    }
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
      debouncedFetchSuggestions(query); // Fetch suggestions with debounce
    } else {
      setSuggestions([]);
    }
  };

  // Handle address selection
  /*
  const handleAddressSelect = async (address: string) => {
    console.log(`DEBUG: Address selected: ${address}`);
    setSearchQuery(address);
    setSuggestions([]);

    let selectedLocation: Region | null;

    if (address === debugAddress && DEBUG_MODE) {
      console.log('DEBUG: Using debug coordinates for selected address.');
      selectedLocation = debugCoordinates;
    } else {
      selectedLocation = await geocodeAddress(address); // Geocoding live address
    }
    if(selectedLocation){
      setCurrentLocation(selectedLocation);
      updateSession({ searchLocation: selectedLocation });
      console.log('DEBUG: Search Location:', selectedLocation);
      if (searchLocation) {
        mapRef.current?.animateToRegion(searchLocation, 1000); // Smoothly pan to location
      }
      else {
        mapRef.current?.animateToRegion(selectedLocation, 1000);
        console.log('DEBUG: Animating to Selected Location:', selectedLocation);
      }
      await updateHazards(selectedLocation);
    }
  };*/
  const [selectedSuggestion, setSelectedSuggestion] = useState(false);

  const handleAddressSelect = async (address: string) => {
    console.log(`DEBUG: Address selected: ${address}`);
    setSearchQuery(address); // Set the selected address in the search bar
    setSuggestions([]); // Clear suggestions once an address is selected

    await new Promise(resolve => setTimeout(resolve, 10));
    const selectedLocation = await geocodeAddress(address);

    if (selectedLocation) {
      setCurrentLocation(selectedLocation); // Update map's current location
      setSearchLocation(selectedLocation); // Set the searched location
      updateSession({ searchLocation: selectedLocation });
      console.log('DEBUG: Search Location:', selectedLocation);

      // Pan to selected
      mapRef.current?.animateToRegion(selectedLocation, 1000);

      // Optionally fetch hazards for the new location
      await updateHazards(selectedLocation);
    }
    setSelectedSuggestion(true);
  };

  // Trigger search when the search field loses focus
  /*
  const handleBlur = () => {
    if (searchQuery) {
      handleAddressSelect(searchQuery);
    }
  };
  */
  const handleBlur = () => {
    if (selectedSuggestion) {
      setSelectedSuggestion(false);
      return;
    }
    geocodeAddress(searchQuery).then((location) => {
      if (location) {
        setCurrentLocation(location);
        setSearchLocation(location);
        updateSession({ searchLocation: location });
        mapRef.current?.animateToRegion(location, 1000);
        updateHazards(location);
      }
    });
  };

  // Show an alert for the three-dot menu (placeholder for future functionality)
  const handleMenuPress = () => {
    Alert.alert('Menu', 'Three-dot menu pressed.');
  };

  // Handle hazards update
  const updateHazards = useCallback(async (location: Region) => {
    setLoading(true);
    try {
      const fetchedHazards = await fetchHazards(location); // Now passing the region
      setHazards(fetchedHazards);
      console.log('DEBUG: Hazards updated:', fetchedHazards);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch hazards.');
    } finally {
      setLoading(false);
    }
  }, []);

    // Debounce the updateHazards function to limit API calls
  const debouncedUpdateHazards = useCallback(
    debounce((region: Region) => {
      updateHazards(region);
    }, 10000), // 10000ms debounce time
    [updateHazards]
  );
  // Handle map region change
  useFocusEffect(
    useCallback(() => {
      const loadHazards = async () => {
        setLoading(true);
        const fetchedHazards = await fetchHazards(currentLocation);
        setHazards(fetchedHazards);
        setLoading(false);
      };

      loadHazards();
    }, [])
  );

  // Color spec for hazard ratings
  const getColorRating = (rating: string) => {
    switch (rating){
      case 'Minor':
        return '#237F52';
      case 'Low':
        return '#005387';
      case 'Medium':
        return '#F9A900';
      case 'High':
        return '#9B2423';
      default:
        return 'gray';
    }
  }

  const getHazardIcon = (type: string, rating: string) => {
    const color = getColorRating(rating);
    const iconProps = { size: 30, color};
    // Set icon size and color based on rating
    switch (type.toLowerCase()){
      case 'fallen tree':
        return <MaterialCommunityIcons name="tree" {...iconProps}/>;
      case 'flood':
        return <MaterialCommunityIcons name="water" {...iconProps}/>;
      case 'fallen powerline':
        return <MaterialCommunityIcons name="flash" {...iconProps}/>;
      case 'fire':
        return <MaterialCommunityIcons name="fire" {...iconProps}/>;
      default:
        return <MaterialCommunityIcons name="map-marker" {...iconProps}/>;
    }
  };

  /*
  ###################################################################
  ## -- PRESENTATION / UI --                                    ##
  ###################################################################
  */

  return (
    <View style={styles.pageContainer}>
      {/*Settings Button*/}
      <Pressable onPress={() => {
        console.log('Navigating to settings'); // Debug: Log navigation
        router.push('/settings'); // Navigate to settings page
        }}
        style={styles.settingsButton}
        >
        <Ionicons name="settings" size={24} color={theme === 'dark' ? 'white' : 'black'} />
      </Pressable>
        {/* Search Bar */}
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
            <Ionicons name="close-circle" size={20} color={theme === 'dark' ? "gray" : 'black'} />
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
          {/*
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
          */}
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleAddressSelect(item)} // Handle selection
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              showsUserLocation={true}
              followsUserLocation={NAVIGATION_MODE ? true : false}
              region={currentLocation} // Dynamically update the map region
              onRegionChangeComplete={(region) => {
                setCurrentLocation(region);
                debouncedUpdateHazards(region); // <-- Fetch hazards when the map stops moving
              }}
            >
              {searchLocation && (
                <Marker
                  coordinate={{
                    latitude: searchLocation.latitude,
                    longitude: searchLocation.longitude,
                  }}
                  title="pin"
                  description={`Address: ${searchQuery}\nCoordinates: (${searchLocation.latitude}, ${searchLocation.longitude})`}
                />
                )}
              {hazards.map((hazard) => (
                <Marker
                  key={hazard.id}
                  coordinate={{ latitude: hazard.latitude, longitude: hazard.longitude }}
                  title={hazard.type}
                  //description={hazard.description}
                  onPress={() => {
                      console.log('Navigating to viewHazard with ID:', hazard.id);
                      router.push({ pathname: '/viewHazard', params: { hazardId: hazard.id } });
                  }}
                >
                {getHazardIcon(hazard.type, hazard.rating)}
              </Marker>
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

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  wrapper: { flex: 1 },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%', padding: 5 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#1E1E1E' : 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    color: theme === 'dark' ? 'white' : 'black',
  },
  menuIcon: {
    marginLeft: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#444' : '#ccc',
    backgroundColor: theme === 'dark' ? '#2a2a2a' : 'white',
  },
  suggestionText: {
    fontSize: 16,
    color: theme === 'dark' ? 'white' : 'black',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  titleContainer: {
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme === 'dark' ? 'white' : 'black',
  },
  pageContainer: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#121212' : 'white',
  },
  settingsButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
  },
  clearButton: {
    marginHorizontal: 5,
  },
  robotoFont: {
    fontFamily: 'RobotoRegular',
  },
});