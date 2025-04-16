import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import DeviceCountry from 'react-native-device-country';


/** Additional installs **/
// npx expo install react-native-maps
// npx expo-location install
// npm install react-native-device-country
// ... if developing for other platforms also need
// npx pod-install - on mac

// TODO
// -- stick a reload button icon on the screen if map services disabled...

/*
###################################################################
## -- DATA DEFINITIONS & SETUP --                                          ##
###################################################################
*/

// Type Definitions //
type LocationData = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Default location (Brisbane, Australia)
const DEFAULT_REGION: LocationData = {
  latitude: -27.4698,
  longitude: 153.0251,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

/*
###################################################################
## -- HELPER FUNCTIONS --                                       ##
###################################################################
*/
  
// Timeout logic if required
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Location Fallback - Generic Attempt 1 (IP)
// If permissions denied... this will try to get a generic location 
const getGenericLocationFromIP = async (): Promise<LocationData | null> => {
  try {
    Alert.alert('Using generic location', 'Using IP-based location as permissions were denied.'); // Notify user
    // include timeout in request
    const res = await withTimeout(fetch('https://ipapi.co/json/'), 900);
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    return null;
  } catch (e) {
    console.warn('IP lookup failed or timed out:', e); // Failure is logged for debugging
    return null;
  }
};  

// Location Fallback - Generic Attempt 2 (Country)
// If permissions denied... this will try to get a generic location 
const getGenericLocationByCountry = async (): Promise<LocationData | null> => {
  try {
    Alert.alert('Using country-based location', 'IP-based location failed, using country as a fallback.');
    //await withTimeout(fetch('https://ipapi.co/json/'), 900);
    //const result = await DeviceCountry.getCountryCode();
    const result = await withTimeout(DeviceCountry.getCountryCode(), 900);
    // result.code is the country code, e.g., "AU"
    if (result && result.code) {
      const countryLocations: { [key: string]: LocationData } = {
        AU: { latitude: -27.4698, longitude: 153.0251, latitudeDelta: 0.1, longitudeDelta: 0.1 }, // Brisbane, Australia
        GB: { latitude: 55.378051, longitude: -3.435973, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // United Kingdom
        CA: { latitude: 56.130366, longitude: -106.346771, latitudeDelta: 10, longitudeDelta: 10 }, // Canada
        IE: { latitude: 53.41291, longitude: -8.24389, latitudeDelta: 0.2, longitudeDelta: 0.2 }, // Ireland
        NZ: { latitude: -40.900557, longitude: 174.885971, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // New Zealand
        ZA: { latitude: -30.559482, longitude: 22.937506, latitudeDelta: 1, longitudeDelta: 1 }, // South Africa
        JM: { latitude: 18.109581, longitude: -77.297508, latitudeDelta: 0.2, longitudeDelta: 0.2 }, // Jamaica
        SG: { latitude: 1.352083, longitude: 103.819836, latitudeDelta: 0.05, longitudeDelta: 0.05 }, // Singapore
        IN: { latitude: 20.593684, longitude: 78.96288, latitudeDelta: 2, longitudeDelta: 2 }, // India
        DE: { latitude: 51.165691, longitude: 10.451526, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Germany
        FR: { latitude: 46.227638, longitude: 2.213749, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // France
        IT: { latitude: 41.87194, longitude: 12.56738, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Italy
        ES: { latitude: 40.463667, longitude: -3.74922, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Spain
        RU: { latitude: 61.52401, longitude: 105.318756, latitudeDelta: 10, longitudeDelta: 10 }, // Russia
        CN: { latitude: 35.86166, longitude: 104.195397, latitudeDelta: 5, longitudeDelta: 5 }, // China
        JP: { latitude: 36.204824, longitude: 138.252924, latitudeDelta: 1, longitudeDelta: 1 }, // Japan
        KR: { latitude: 35.907757, longitude: 127.766922, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // South Korea
        BR: { latitude: -14.235004, longitude: -51.92528, latitudeDelta: 2, longitudeDelta: 2 }, // Brazil
        AR: { latitude: -38.416097, longitude: -63.616672, latitudeDelta: 1, longitudeDelta: 1 }, // Argentina
        MX: { latitude: 23.634501, longitude: -102.552784, latitudeDelta: 1, longitudeDelta: 1 }, // Mexico
        TR: { latitude: 38.963745, longitude: 35.243322, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Turkey
        SA: { latitude: 23.885942, longitude: 45.079162, latitudeDelta: 1, longitudeDelta: 1 }, // Saudi Arabia
        EG: { latitude: 26.820553, longitude: 30.802498, latitudeDelta: 1, longitudeDelta: 1 }, // Egypt
        NG: { latitude: 9.081999, longitude: 8.675277, latitudeDelta: 1, longitudeDelta: 1 }, // Nigeria
        KE: { latitude: -0.023559, longitude: 37.906193, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Kenya
        ID: { latitude: -0.789275, longitude: 113.921327, latitudeDelta: 2, longitudeDelta: 2 }, // Indonesia
        PK: { latitude: 30.375321, longitude: 69.345116, latitudeDelta: 1, longitudeDelta: 1 }, // Pakistan
        BD: { latitude: 23.684994, longitude: 90.356331, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Bangladesh
        VN: { latitude: 14.058324, longitude: 108.277199, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Vietnam
        TH: { latitude: 15.870032, longitude: 100.992541, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Thailand
        PH: { latitude: 12.879721, longitude: 121.774017, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Philippines
        MY: { latitude: 4.210484, longitude: 101.975766, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Malaysia
        SE: { latitude: 60.128161, longitude: 18.643501, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Sweden
        NO: { latitude: 60.472024, longitude: 8.468946, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Norway
        DK: { latitude: 56.26392, longitude: 9.501785, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Denmark
        FI: { latitude: 61.92411, longitude: 25.748151, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Finland
        PL: { latitude: 51.919438, longitude: 19.145136, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Poland
        NL: { latitude: 52.132633, longitude: 5.291266, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Netherlands
        CH: { latitude: 46.818188, longitude: 8.227512, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Switzerland
        BE: { latitude: 50.503887, longitude: 4.469936, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Belgium
        AT: { latitude: 47.516231, longitude: 14.550072, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Austria
        GR: { latitude: 39.074208, longitude: 21.824312, latitudeDelta: 0.5, longitudeDelta: 0.5 }, // Greece
        US: { latitude: 37.0902, longitude: -95.7129, latitudeDelta: 10, longitudeDelta: 10 } // USA
      };
        
      try {
        const result = await withTimeout(DeviceCountry.getCountryCode(), 900);
        if (result && result.code && countryLocations[result.code]) {
            return countryLocations[result.code];
        }
      } catch (e) {
        console.warn('Country code lookup failed:', e);
      }
    }
    return null;
  } catch (e) {
    console.warn('getGenericLocationByCountry failed:', e);
    return null;
  }
};

// Main Location Function to get precise location if available (Device Location)
const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // check current location services / gps permissions
    const { locationServicesEnabled, gpsAvailable } = await Location.getProviderStatusAsync();
    if (!locationServicesEnabled) {
      Alert.alert(
          'Location services disabled',
          'Please enable location services in your device settings to use this feature.',
          [{ text: 'OK' }]
      );
      return null;
    }

    const { status } = await withTimeout(Location.requestForegroundPermissionsAsync(), 3000);
      if (status !== 'granted') {
          Alert.alert('Location permissions denied', 'Enable location in settings to use all features of this app');
          return null;
      }

    const loc = await withTimeout(Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
    }), 5000);

    // (instead of return location)
    return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };
  } 
  catch (error) {
    console.error('Error getting current location:', error);
    //setErrorMsg('Error getting location');
    return null; 
  }
};

/*
###################################################################
## -- TAB / SCREEN CONTROL LOGIC --                              ##
###################################################################
*/
// Home screen / Index block
export default function Index() {
  //const [location, setLocation] = useState<Region | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Location Flow Control logic for useEffect...
  const loadLocation = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    let initialLocation: LocationData | null = null;
    try {
      // Include fallback for web browser user
      if (Platform.OS === "web") {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              //setLocation
              initialLocation = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              // Populate the location object and stop the loading event / condition 
              setLocation(initialLocation);
              setLoading(false);
            },
            async () => {
              try {
                // Fallback Default Location implementation
                initialLocation =
                  (await getGenericLocationFromIP()) || DEFAULT_REGION;
                setLocation(initialLocation);
              } catch (e) {
                console.warn("Web IP or default lookup failed", e);
                setErrorMsg("Error getting location");
              } finally {
                setLoading(false);
              }
            }
          );
        } else {
          initialLocation = DEFAULT_REGION; // Web default handling
          setLocation(initialLocation);
          setLoading(false);
        }
      } else {
        // Check location services before attempting to get location
        const { locationServicesEnabled } =
          await Location.getProviderStatusAsync();
        if (!locationServicesEnabled) {
          Alert.alert(
            "Location services disabled",
            "Please enable location services in your device settings to use this feature.",
            [{ text: "OK" }]
          );
          setLocation(DEFAULT_REGION); // Set default location
          setLoading(false);
          return; // Exit the function
        }

        // React Native geolocation
        let nativeLocation = null;
        try {
          nativeLocation = await getCurrentLocation(); // First precise geo-location attepmt goes ere
        } catch (e) {
          console.warn("getCurrentLocation timed out", e);
        }

        if (nativeLocation) {
          initialLocation = nativeLocation;
        } else {
          // if the react-native location fails
          // Try getting a generic location from IP, then country, then use default - fallback
          try {
            initialLocation = await getGenericLocationFromIP();
            if (!initialLocation) {
              initialLocation = await getGenericLocationByCountry();
            }
          } catch (e) {
            console.warn("Fallback IP/Country lookup failed", e);
            setErrorMsg("Error getting generic location");
          } finally {
            // If all else fails do a default
            // (Protection to ensure we always have a location in the end)
            initialLocation = initialLocation || DEFAULT_REGION; 
          }
        }
        // Do the location business agin
        // Set location and stop loading state
        setLocation(initialLocation);
        setLoading(false);
      }
    } catch (error: any) {
        // Hopefully catch any naughty errors we've otherwise missed
        console.error("Error in location flow:", error);
        setErrorMsg("Error getting generic location");
        setLoading(false);
    }
  }, []);

  // Load location instruction - importanto
  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  /*
  ###################################################################
  ## -- UI RENDERING / VIEW CONTROL / CONTAINER LOGIC & DESIGN --  ##
  ###################################################################
  */
  if (loading) {
    // View Loading Condition
    return (
      <View style={styles.wrapper}>
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </View>
    );
  }
  if (errorMsg) {
    // View Error Condition
    return (
      <View style={styles.wrapper}>
        <Text style={{ color: "red", marginTop: 50, textAlign: "center" }}>
          {errorMsg}
        </Text>
      </View>
    );
  }
  return (
    // View Default Condition
    <View style={styles.wrapper}>
      {/*Settings Button*/}
      <Pressable
        onPress={() => router.push("/settings")}
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
        {location && (
          <MapView
            style={styles.map}
            initialRegion={location}
            showsUserLocation={true}
            onMapReady={() => console.log("Map is ready")}
          />
        )}
      </View>
      <Pressable
        onPress={loadLocation}
        style={styles.refreshButton}
      >
        <Ionicons name="compass-outline" size={24} color="black" />
      </Pressable>
    </View>
  );
}


/*
###################################################################
## -- STYLE CONTROL AND DESIGN --                                ##
###################################################################
*/

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
    zIndex: 1,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#eee',
    borderRadius: 50,
    padding: 15,
    zIndex: 1,
  }
});