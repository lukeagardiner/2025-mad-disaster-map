import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getFirestore, updateDoc, increment } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase';
import { useIsFocused } from '@react-navigation/native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const app = initializeApp(firebaseConfig);
const db = getFirestore();
// Geoapify API key (same as in SearchPage)
const GEOAPIFY_API_KEY = '9bf2f555990c4aa384b93daa6dd23757';

export default function ViewHazard() {
    const { hazardId } = useLocalSearchParams<{ hazardId: string }>();
    const [hazard, setHazard] = useState<any>(null);
    const [address, setAddress] = useState<string>('Loading address...');
    const [stillThereSelection, setStillThereSelection] = useState<'yes' | 'no' | null>(null);
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

    const handleVoteSelection = async (selection: 'yes' | 'no') => {
        if (stillThereSelection !== null) return; // Prevent double vote
        try {
            setStillThereSelection(selection);
            await AsyncStorage.setItem(`voteStatus_${hazardId}`, selection);
            await handleVote(selection === 'yes' ? 'upvote' : 'downvote');
        } catch (error) {
            console.error('Failed to save vote status:', error);
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

    const dummyImages = [
        require('@/assets/images/favicon.png'),
        require('@/assets/images/react-logo.png')
    ];

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
            </View>
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
    fontFamily: 'RobotoRegular', // Single line for font application
  },
});