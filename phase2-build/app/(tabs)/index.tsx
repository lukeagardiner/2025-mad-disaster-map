import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, ActivityIndicator, Alert, Pressable, Switch, } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "../../SessionContext";
import DeviceCountry from "react-native-device-country";
import { useTheme } from "@/theme/ThemeContext";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase";

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore();

const DEBUG_MODE = 0;

/*
###################################################################
## -- DATA DEFINITIONS & SETUP --                                ##
###################################################################
*/

type LocationData = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

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

// Haversine formula to calculate distance between two coordinates (in kilometers)
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Timeout logic
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), ms);
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

// Location Fallback - IP-based
const getGenericLocationFromIP = async (): Promise<LocationData | null> => {
  try {
    Alert.alert(
      "Using generic location",
      "Using IP-based location as permissions were denied."
    );
    const res = await withTimeout(fetch("https://ipapi.co/json/"), 900);
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
    console.warn("IP lookup failed or timed out:", e);
    return null;
  }
};

// Location Fallback - Country-based
const getGenericLocationByCountry = async (): Promise<LocationData | null> => {
  try {
    Alert.alert(
      "Using country-based location",
      "IP-based location failed, using country as a fallback."
    );
    const result = await withTimeout(DeviceCountry.getCountryCode(), 2000);
    const countryLocations: { [key: string]: LocationData } = {
      AU: { latitude: -27.4698, longitude: 153.0251, latitudeDelta: 0.1, longitudeDelta: 0.1 },
      GB: { latitude: 55.378051, longitude: -3.435973, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      CA: { latitude: 56.130366, longitude: -106.346771, latitudeDelta: 10, longitudeDelta: 10 },
      IE: { latitude: 53.41291, longitude: -8.24389, latitudeDelta: 0.2, longitudeDelta: 0.2 },
      NZ: { latitude: -40.900557, longitude: 174.885971, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      ZA: { latitude: -30.559482, longitude: 22.937506, latitudeDelta: 1, longitudeDelta: 1 },
      JM: { latitude: 18.109581, longitude: -77.297508, latitudeDelta: 0.2, longitudeDelta: 0.2 },
      SG: { latitude: 1.352083, longitude: 103.819836, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      IN: { latitude: 20.593684, longitude: 78.96288, latitudeDelta: 2, longitudeDelta: 2 },
      DE: { latitude: 51.165691, longitude: 10.451526, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      FR: { latitude: 46.227638, longitude: 2.213749, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      IT: { latitude: 41.87194, longitude: 12.56738, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      ES: { latitude: 40.463667, longitude: -3.74922, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      RU: { latitude: 61.52401, longitude: 105.318756, latitudeDelta: 10, longitudeDelta: 10 },
      CN: { latitude: 35.86166, longitude: 104.195397, latitudeDelta: 5, longitudeDelta: 5 },
      JP: { latitude: 36.204824, longitude: 138.252924, latitudeDelta: 1, longitudeDelta: 1 },
      KR: { latitude: 35.907757, longitude: 127.766922, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      BR: { latitude: -14.235004, longitude: -51.92528, latitudeDelta: 2, longitudeDelta: 2 },
      AR: { latitude: -38.416097, longitude: -63.616672, latitudeDelta: 1, longitudeDelta: 1 },
      MX: { latitude: 23.634501, longitude: -102.552784, latitudeDelta: 1, longitudeDelta: 1 },
      TR: { latitude: 38.963745, longitude: 35.243322, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      SA: { latitude: 23.885942, longitude: 45.079162, latitudeDelta: 1, longitudeDelta: 1 },
      EG: { latitude: 26.820553, longitude: 30.802498, latitudeDelta: 1, longitudeDelta: 1 },
      NG: { latitude: 9.081999, longitude: 8.675277, latitudeDelta: 1, longitudeDelta: 1 },
      KE: { latitude: -0.023559, longitude: 37.906193, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      ID: { latitude: -0.789275, longitude: 113.921327, latitudeDelta: 2, longitudeDelta: 2 },
      PK: { latitude: 30.375321, longitude: 69.345116, latitudeDelta: 1, longitudeDelta: 1 },
      BD: { latitude: 23.684994, longitude: 90.356331, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      VN: { latitude: 14.058324, longitude: 108.277199, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      TH: { latitude: 15.870032, longitude: 100.992541, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      PH: { latitude: 12.879721, longitude: 121.774017, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      MY: { latitude: 4.210484, longitude: 101.975766, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      SE: { latitude: 60.128161, longitude: 18.643501, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      NO: { latitude: 60.472024, longitude: 8.468946, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      DK: { latitude: 56.26392, longitude: 9.501785, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      FI: { latitude: 61.92411, longitude: 25.748151, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      PL: { latitude: 51.919438, longitude: 19.145136, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      NL: { latitude: 52.132633, longitude: 5.291266, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      CH: { latitude: 46.818188, longitude: 8.227512, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      BE: { latitude: 50.503887, longitude: 4.469936, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      AT: { latitude: 47.516231, longitude: 14.550072, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      GR: { latitude: 39.074208, longitude: 21.824312, latitudeDelta: 0.5, longitudeDelta: 0.5 },
      US: { latitude: 37.0902, longitude: -95.7129, latitudeDelta: 10, longitudeDelta: 10 },
    };
    if (result && result.code && countryLocations[result.code]) {
      return countryLocations[result.code];
    }
    return null;
  } catch (e) {
    console.warn("getGenericLocationByCountry failed:", e);
    return null;
  }
};

// Main Location Function
const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const { locationServicesEnabled } = await Location.getProviderStatusAsync();
    if (!locationServicesEnabled) {
      Alert.alert(
        "Location services disabled",
        "Please enable location services in your device settings to use this feature.",
        [{ text: "OK" }]
      );
      return null;
    }

    const { status } = await withTimeout(
      Location.requestForegroundPermissionsAsync(),
      15000
    );
    if (status !== "granted") {
      Alert.alert(
        "Location permissions denied",
        "Enable location in settings to use all features of this app"
      );
      return null;
    }

    const loc = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      20000
    );
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
};

// Fetch hazards from Firestore
const fetchHazards = async (center: LocationData): Promise<Hazard[]> => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const hazardsQuery = query(
      collection(db, "hazards"),
      where("timestamp", ">=", threeDaysAgo),
      where("downvotes", "<=", 5)
    );
    const querySnapshot = await getDocs(hazardsQuery);
    const hazardList: Hazard[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const location = data.location;

      if (
        location &&
        typeof location.latitude === "number" &&
        typeof location.longitude === "number" &&
        typeof data.hazard === "string" &&
        typeof data.description === "string"
      ) {
        const distance = haversineDistance(
          center.latitude,
          center.longitude,
          location.latitude,
          location.longitude
        );
        if (distance <= 50) {
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
            downvotes: data.downvotes,
          });
        }
      } else {
        console.log(`Invalid data in document ${doc.id}`);
      }
    });

    console.log(`Fetched ${hazardList.length} hazards within 50km of ${center.latitude}, ${center.longitude}`);
    return hazardList;
  } catch (error) {
    console.error("Error fetching hazards from Firestore:", error);
    Alert.alert("Error", "Failed to fetch hazards from Firestore.");
    return [];
  }
};

// Hazard icon based on type and rating
const getColorRating = (rating: string) => {
  switch (rating) {
    case "Minor":
      return "#237F52";
    case "Low":
      return "#005387";
    case "Medium":
      return "#F9A900";
    case "High":
      return "#9B2423";
    default:
      return "gray";
  }
};

const getHazardIcon = (type: string, rating: string) => {
  const color = getColorRating(rating);
  const iconProps = { size: 30, color };
  switch (type.toLowerCase()) {
    case "fallen tree":
      return <MaterialCommunityIcons name="tree" {...iconProps} />;
    case "flood":
      return <MaterialCommunityIcons name="water" {...iconProps} />;
    case "fallen powerline":
      return <MaterialCommunityIcons name="flash" {...iconProps} />;
    case "fire":
      return <MaterialCommunityIcons name="fire" {...iconProps} />;
    default:
      return <MaterialCommunityIcons name="map-marker" {...iconProps} />;
  }
};

/*
###################################################################
## -- MAIN COMPONENTS --                                         ##
###################################################################
*/

export default function Index() {
  const { session, updateSession } = useSession();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionSwitch, setPermissionSwitch] = useState(false);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const mapRef = React.useRef<MapView>(null);

  // Load hazards based on device location
  const updateHazards = useCallback(
    async (region: LocationData) => {
      setLoading(true);
      try {
        const fetchedHazards = await fetchHazards(region);
        setHazards(fetchedHazards);
      } catch (e) {
        Alert.alert("Error", "Failed to fetch hazards.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Location Flow Control
  const loadLocation = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const permissionResponse = await Location.requestForegroundPermissionsAsync();
      updateSession({ locationPermission: permissionResponse });

      if (permissionResponse.status === "granted") {
        const loc = await getCurrentLocation();
        if (!loc) throw new Error("Failed to get device location.");
        setLocation(loc);
        updateSession({ currentLocation: loc });
        await updateHazards(loc);
      } else if (permissionResponse.status === "denied") {
        throw new Error("Permissions denied.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
      setLocation(DEFAULT_REGION);
      updateSession({ currentLocation: DEFAULT_REGION });
      await updateHazards(DEFAULT_REGION);
    } finally {
      setLoading(false);
    }
  }, [updateSession, updateHazards]);

  useEffect(() => {
    if (!session.currentLocation) {
      loadLocation();
    } else {
      setLocation(session.currentLocation);
      updateHazards(session.currentLocation);
    }
  }, [session.currentLocation, loadLocation, updateHazards]);

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.wrapper}>
        <Text style={{ color: "red", textAlign: "center", marginTop: 50 }}>
          {errorMsg}
        </Text>
        <View style={styles.permissionsContainer}>
          <Text style={{ marginBottom: 10 }}>Enable Location Permissions:</Text>
          <Switch
            value={permissionSwitch}
            onValueChange={(value) => {
              setPermissionSwitch(value);
              if (value) loadLocation();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Settings Button */}
      <Pressable
        onPress={() => router.push("/settings")}
        style={styles.settingsButton}
      >
        <Ionicons name="settings" size={24} color="black" />
      </Pressable>

      {/* Main Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Disaster Map</Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {location && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={location}
            showsUserLocation={true}
            onMapReady={() => console.log("Index Map Ready")}
            onRegionChangeComplete={(region) => {
              setLocation(region); // Update map view but don't fetch hazards
            }}
          >
            {hazards.map((hazard) => (
              <Marker
                key={hazard.id}
                coordinate={{ latitude: hazard.latitude, longitude: hazard.longitude }}
                title={hazard.type}
                onPress={() => {
                  console.log("Navigating to viewHazard with ID:", hazard.id);
                  router.push({ pathname: "/viewHazard", params: { hazardId: hazard.id } });
                }}
              >
                {getHazardIcon(hazard.type, hazard.rating)}
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {/* Refresh Button */}
      <Pressable
        onPress={loadLocation}
        style={styles.refreshButton}
      >
        <Ionicons name="compass-outline" size={20} color="black" />
      </Pressable>

      {/* Loading Indicator */}
      {loading && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
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
    backgroundColor: "white",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
    padding: 5,
  },
  settingsButton: {
    position: "absolute",
    top: 25,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  refreshButton: {
    position: "absolute",
    bottom: "12%",
    right: "5%",
    padding: 5,
    zIndex: 1,
  },
  permissionsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
  robotoFont: {
    fontFamily: "RobotoRegular",
  },
});