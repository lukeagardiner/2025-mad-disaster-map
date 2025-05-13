import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, doc, setDoc, getDoc, getFirestore, updateDoc, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase';
import { useIsFocused } from '@react-navigation/native'; // not used in code but likely for screen refresh logic
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const GEOAPIFY_API_KEY = '9bf2f555990c4aa384b93daa6dd23757'; // API key for reverse geocoding

export default function ViewHazard() {
  // Get hazardId from navigation parameters
  const { hazardId } = useLocalSearchParams<{ hazardId: string }>();
  const [hazard, setHazard] = useState<any>(null); // Stores hazard data from Firestore
  const [address, setAddress] = useState<string>('Loading address...');
  const [stillThereSelection, setStillThereSelection] = useState<'yes' | 'no' | null>(null); // Tracks if user has voted
  const auth = getAuth(app);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false); // Tracks if user is subscribed to updates

  console.log('Passed HazardID:', hazardId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      // Get Expo push token
      if (!Device.isDevice) {
        alert('Must use physical device for push notifications');
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      const expoPushTokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = expoPushTokenData.data;
      const subscriberRef = doc(db, 'hazards', hazardId, 'subscribers', user.uid);
      await setDoc(subscriberRef, {
        subscribedAt: serverTimestamp(),
        expoPushToken,
      });
      setIsSubscribed(true);
      console.log('User subscribed with Expo token:', expoPushToken);
    } catch (error) {
      console.error('Error subscribing to hazard:', error);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    try {
      const subscriberRef = doc(db, 'hazards', hazardId, 'subscribers', user.uid);
      await deleteDoc(subscriberRef);
      setIsSubscribed(false);
      console.log('User unsubscribed from hazard updates');
    } catch (error) {
      console.error('Error unsubscribing from hazard:', error);
    }
  }

  // Vote handler for upvote/downvote fields in Firestore
  const handleVote = async (type: 'upvote' | 'downvote') => {
    try {
      const hazardRef = doc(db, 'hazards', hazardId);
      await updateDoc(hazardRef, {
        [type === 'upvote' ? 'upvotes' : 'downvotes']: increment(1),
      });
      console.log(`${type} successful`);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Handles selection of "Still there?" vote and prevents multiple votes using local storage
  const handleVoteSelection = async (selection: 'yes' | 'no') => {
    if (stillThereSelection !== null) return; // Prevent double voting
    try {
      setStillThereSelection(selection);
      await AsyncStorage.setItem(`voteStatus_${hazardId}`, selection); // Store vote locally
      await handleVote(selection === 'yes' ? 'upvote' : 'downvote');
    } catch (error) {
      console.error('Failed to save vote status:', error);
    }
  };

  // Fetch hazard details from Firestore once hazardId is available
  useEffect(() => {
    const fetchHazard = async () => {
      if (!hazardId) return;

      try {
        const docRef = doc(db, 'hazards', hazardId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setHazard(snapshot.data());
        } else {
          console.log('No such document!');
          setAddress('Address not found');
        }
      } catch (error) {
        console.error('Error fetching hazard:', error);
        setAddress('Failed to load address');
      }
    };
    fetchHazard();
  }, [hazardId]);

  // Reverse geocode coordinates to get a readable address
  useEffect(() => {
    const reverseGeocode = async () => {
      if (!hazard?.location?.latitude || !hazard?.location?.longitude) {
        setAddress('Invalid coordinates');
        return;
      }
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${hazard.location.latitude}&lon=${hazard.location.longitude}&apiKey=${GEOAPIFY_API_KEY}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          setAddress(data.features[0].properties.formatted);
        } else {
          setAddress('Address not found');
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        setAddress('Failed to load address');
      }
    };
    reverseGeocode();
  }, [hazard]);

  // Check if user has already voted and if they are subscribed
  useEffect(() =>{
    const checkStoredVoteAndSubscription = async () => {
      if(!hazardId || !user)  return;
      try {
        const storedVote = await AsyncStorage.getItem(`voteStatus_${hazardId}`); // Retrieve vote status from local storage
        if(storedVote === 'yes' || storedVote === 'no') {
          setStillThereSelection(storedVote);
        }
        const subscriberRef = doc(db, 'hazards', hazardId, 'subscribers', user.uid); // Check if user is subscribed
        const subscriberSnap = await getDoc(subscriberRef);
        if (subscriberSnap.exists()) {
          setIsSubscribed(true);
        }
      }
      catch (error) {
        console.error('Error checking vote/subscription:', error);
      }
    };
    checkStoredVoteAndSubscription();
  }, [hazardId, user]);

  // Show loading state until hazard data is available
  if (!hazard) {
    return (
      <View style={styles.pageContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Temporary image placeholders — replace with hazard image URLs in production
  const dummyImages = [
    require('@/assets/images/favicon.png'),
    require('@/assets/images/react-logo.png')
  ];

  return (
    <>
      {/* Stack screen header configuration */}
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
      <ScrollView contentContainerStyle={styles.pageContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.text, styles.robotoFont]}>View Hazard</Text>
        </View>

        {/* Render each hazard field */}
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Type</Text>
          <Text style={styles.fieldValue}>{hazard.hazard}</Text>
        </View>
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Rating</Text>
          <Text style={styles.fieldValue}>{hazard.rating}</Text>
        </View>
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.fieldValue}>{address}</Text>
        </View>
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Date/Time Submitted</Text>
          <Text style={styles.fieldValue}>{hazard.timestamp?.toDate?.().toString() ?? 'N/A'}</Text>
        </View>
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.fieldValue}>{hazard.description}</Text>
        </View>

        {/* Images carousel */}
        <Text style={styles.fieldLabel}>Submitted Images</Text>
        <View style={styles.imageRow}>
          <FlatList
            data={dummyImages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item }) => (
              <Image source={item} style={styles.carouselImage} resizeMode="cover" />
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Still There? vote section */}
        <Text style={styles.fieldLabel}>Still There?</Text>
        <View style={styles.voteContainer}>
          <TouchableOpacity
            onPress={() => handleVoteSelection('yes')}
            style={[
              styles.voteButton,
              stillThereSelection === 'yes' && styles.selectedButton,
            ]}
            disabled={stillThereSelection !== null}
          >
            <Text style={[
              styles.voteText,
              stillThereSelection === 'yes' && styles.voteTextSelected
            ]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleVoteSelection('no')}
            style={[
              styles.voteButton,
              stillThereSelection === 'no' && styles.selectedButton,
            ]}
            disabled={stillThereSelection !== null}
          >
            <Text style={[
              styles.voteText,
              stillThereSelection === 'no' && styles.voteTextSelected
            ]}>No</Text>
          </TouchableOpacity>
        </View>
        {/* Subscribe and Unsubscribe Buttons */}
        {user && (
          <TouchableOpacity
            style={[
              styles.voteButton,
              { marginBottom: 30 },
              isSubscribed && { backgroundColor: '#f8d7da', borderColor: '#dc3545' },
            ]}
            onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
          >
            <Text style={[
              styles.voteText,
              isSubscribed && { color: '#dc3545' }
            ]}>
              {isSubscribed ? 'Unsubscribe' : 'Subscribe to Updates'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

// Styling for the component layout, vote buttons, and hazard data fields
const styles = StyleSheet.create({
  pageContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
  voteButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginHorizontal: 8,
    borderColor: "#888",
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  selectedButton: {
    backgroundColor: "#e3e1f9",
    borderColor: "#6a5acd",
  },
  voteText: {
    fontWeight: 'bold',
    color: '#6a5acd',
  },
  voteTextSelected: {
    color: '#fff',
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  fieldBox: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#000',
  },
  imageRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  carouselContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  carouselImage: {
    height: 150,
    width: 150,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginHorizontal: 10,
  },
  robotoFont: {
    fontFamily: 'RobotoRegular',
  },
});