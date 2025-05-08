import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getFirestore, updateDoc, increment } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase';
import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Geoapify API key (same as in SearchPage)
const GEOAPIFY_API_KEY = '9bf2f555990c4aa384b93daa6dd23757';

export default function ViewHazard() {
    const { hazardId } = useLocalSearchParams<{ hazardId: string }>();
    const [hazard, setHazard] = useState<any>(null);
    const [address, setAddress] = useState<string>('Loading address...');
    console.log('Passed HazardID:', hazardId);

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

    if (!hazard) {
        return (
            <View style={styles.pageContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

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
        <ScrollView contentContainerStyle={styles.pageContainer}>
            <View style={styles.titleContainer}>
                <Text style={[styles.text, styles.robotoFont]}>View Hazard</Text>
                <Text>Type: {hazard.hazard}</Text>
                <Text>Address: {address}</Text>
                <Text>Date/Time Submitted: {hazard.timestamp?.toDate?.().toString() ?? 'N/A'}</Text>
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionInput}>Description: {hazard.description}</Text>
                </View>
                <Text>Latitude: {hazard.location?.latitude ?? 'N/A'}</Text>
                <Text>Longitude: {hazard.location?.longitude ?? 'N/A'}</Text>
            </View>
            <Text>Still There?</Text>
            <View style={styles.voteContainer}>
                <TouchableOpacity onPress={() => handleVote('upvote')} style={styles.voteButton}>
                  <Text style={styles.voteText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleVote('downvote')} style={styles.voteButton}>
                  <Text style={styles.voteText}>No</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
        </>
    );
}

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
    robotoFont: {
        // fontFamily: 'Roboto', // Uncomment if Roboto is configured
    },
    voteButton: {
      padding: 10,
      marginVertical: 5,
      backgroundColor: '#4CAF50',
      borderRadius: 5,
      alignItems: 'center',
      width: 65,
    },
    voteText: {
      color: 'white',
      fontWeight: 'bold',
    },
    voteContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 10,
      paddingHorizontal: 20,
      gap: 15,
    },
    descriptionContainer: {
        width: '85%',
        marginTop: 20,
    },
    descriptionInput: {
        height: 150,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        color: 'black',
        fontFamily: 'Roboto',
    },
});