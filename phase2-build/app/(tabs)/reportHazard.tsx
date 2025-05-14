import { View, Text, StyleSheet, Pressable, GestureResponderEvent, TextInput, Keyboard, } from "react-native";
import { TouchableWithoutFeedback, Image, Dimensions, FlatList, } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase";
import { useTheme } from "@/theme/ThemeContext"; // Access theme controls

const app = initializeApp(firebaseConfig); // Initialize Firebase app
const db = getFirestore(); // Initialize Firestore instance once

export default function ReportHazardScreen() {
  const { theme } = useTheme(); // Get current theme from ThemeContext
  const styles = getStyles(theme); // Pass theme to getStyles
  const GEOAPIFY_API_KEY = "9bf2f555990c4aa384b93daa6dd23757"; // API key for geocoding service
  const descriptionRef = useRef(null); // Reference to the description input field
  const [selectedHazard, setSelectedHazard] = useState(""); // State to track the selected hazard
  const [selectedHazardRating, setSelectedHazardRating] = useState(""); // State to track hazard rating
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Tracks dropdown state
  const [isDropdownOpen2, setIsDropdownOpen2] = useState(false); // Tracks dropdown state
  const [description, setDescription] = useState(""); // Tracks the description state
  const [address, setAddress] = useState(""); // Tracks the address state
  const addressRef = useRef(null); // Reference to the address input field
  const [images, setImages] = useState<string[]>([]); // State to track the selected images (URIs)
  const hazardOptions = ["Flood", "Fallen Tree", "Fallen Powerline", "Fire"]; // Hazard options for the dropdown list
  const hazardSeverity = ["Minor", "Low", "Medium", "High"]; // Hazard rating for dropdown list
  const MAX_WORD_COUNT = 256; // Maximum word count for the description
  const MAX_IMAGES = 3; // Maximum number of images allowed
  const [suggestions, setSuggestions] = useState([]); // State to store address suggestions

  // Reset dropdown selection to default value for hazard types
  function clearSelection(event: GestureResponderEvent): void {
    setSelectedHazard("");
  }

  // Reset dropdown selection to default value for hazard rating
  function clearRatingSelection(event: GestureResponderEvent): void {
    setSelectedHazardRating("");
  }

  // Count the number of words in a given text
  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/);
    return words.length;
  };

  // Fetch address suggestions from Geoapify API
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const addressSuggestions = (text: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            text
          )}&filter=countrycode:au&limit=5&apiKey=${GEOAPIFY_API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error("Geoapify address suggestion error:", error);
      }
    }, 300); // debounce delay
  };

  // Handle changes in the address input field
  const handleAddressChange = (text: string) => {
    addressSuggestions(text);
    setAddress(text);
  };

  // Handle changes in the description input field with max word count
  const handleDescriptionChange = (text: string) => {
    const wordCount = countWords(text);
    if (wordCount <= MAX_WORD_COUNT) {
      setDescription(text);
    } else {
      alert(`Maximum word count is ${MAX_WORD_COUNT}`);
    }
  };

  // Pick an image from the device's media library
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => {
        const newImages = [...prevImages, ...selectedImages];
        return newImages.slice(0, MAX_IMAGES);
      });
    }
  };

  // Take a photo using the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => {
        const newImages = [...prevImages, ...selectedImages];
        return newImages.slice(0, MAX_IMAGES);
      });
    }
  };

  // Delete an image from the selected images list
  const handleDeleteImage = (indexToDelete: number) => {
    setImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToDelete)
    );
  };

  // Geocode an address to latitude and longitude using Geoapify API
  const geocodeAddress = async (
    address: string
  ): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          address
        )}&filter=countrycode:au&limit=1&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const { lat, lon } = data.features[0].properties;
        return { lat, lon };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Geoapify geocoding error:", error);
      return null;
    }
  };

  return (
    <View style={styles.pageContainer}>
      {/* Settings Button */}
      <Pressable
        onPress={() => {
          console.log("Navigating to settings");
          router.push("/settings");
        }}
        style={styles.settingsButton}
      >
        <Ionicons name="settings" size={24} color={theme === "dark" ? "white" : "black"} />
      </Pressable>
      {/* Dismiss keyboard when tapping outside of TextInput */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Disaster Map</Text>
          <Text style={styles.text}>Report a Hazard</Text>

          {/* Enter Address Input field */}
          <View style={styles.addressContainer}>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter Address"
              placeholderTextColor={theme === 'dark' ? 'white' : 'gray' }
              value={address}
              ref={addressRef}
              onChangeText={handleAddressChange}
              multiline
              maxLength={50}
            />
          </View>
          {/* Address Suggestions List */}
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  onPress={() => {
                    setAddress(item.properties.formatted);
                    setSuggestions([]);
                  }}
                >
                  <Text style={{ padding: 10, color: theme === 'dark' ? 'white' : 'gray' }}>
                    {item.properties.formatted}
                  </Text>
                </Pressable>
              )}
              style={{ width: "90%", maxHeight: 200 }}
            />
          )}

          {/* Hazard Options dropdown list */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={styles.dropdown}>
              <Text style={styles.dropdown}>
                {selectedHazard || 'Select a Hazard'}
              </Text>
              <Ionicons
                name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme === 'dark' ? 'white' : 'gray'}
                style={styles.dropdownArrow}
              />
            </Pressable>
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {hazardOptions.map((hazardRef, index) => (
                  <Pressable
                    key={index}
                    style={{ padding: 10 }}
                    onPress={() => {
                      setSelectedHazard(hazardRef); // Set selected hazard
                      setIsDropdownOpen(false); // Close dropdown
                    }}>
                    <Text style={styles.dropdownMenu}>{hazardRef}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Clear button for Hazard Options */}
          <Pressable style={styles.clearText} onPress={clearSelection}>
            <Text style={{ color: theme === "dark" ? "#aaa" : "#d3d3d3" }}>Clear Selection</Text>
          </Pressable>

          {/* Hazard Rating dropdown list */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => setIsDropdownOpen2(!isDropdownOpen2)}
              style={styles.dropdown}
            >
              <Text style={styles.dropdownText}>
                {selectedHazardRating || "Hazard Rating"}
              </Text>
              <Ionicons
                name={isDropdownOpen2 ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme === "dark" ? "white" : "black"}
                style={styles.dropdownArrow}
              />
            </Pressable>
            {isDropdownOpen2 && (
              <View style={styles.dropdownMenu}>
                {hazardSeverity.map((hazardRating, index) => (
                  <Pressable
                    key={index}
                    style={{ padding: 10 }}
                    onPress={() => {
                      setSelectedHazardRating(hazardRating);
                      setIsDropdownOpen2(false);
                    }}
                  >
                    <Text style={styles.dropdownMenuText}>{hazardRating}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Clear Selection Button for Hazard Rating */}
          <Pressable style={styles.clearText} onPress={clearRatingSelection}>
            <Text style={{ color: theme === "dark" ? "#aaa" : "#d3d3d3" }}>Clear Selection</Text>
          </Pressable>

          {/* Description Input field */}
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter a description (max 256 words)"
              placeholderTextColor={theme === 'dark' ? 'white' : 'gray'}
              value={description}
              ref={descriptionRef}
              onChangeText={handleDescriptionChange}
              multiline
              maxLength={256}
            />
            <Text style={styles.wordCount}>
              Word Count: {countWords(description)} / {MAX_WORD_COUNT}
            </Text>
          </View>

          <Text style={styles.textImage}>Upload Images</Text>
          {/* Image Upload Buttons */}
          <View style={styles.imageButtonsContainer}>
            <Pressable style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Image from Gallery</Text>
            </Pressable>
            <Pressable style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </Pressable>
          </View>

          {/* Display uploaded images with delete option */}
          {images.length > 0 && (
            <View style={styles.flatListContainer}>
              <FlatList
                data={images}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.imageItem}>
                    <Image source={{ uri: item }} style={styles.pagerImage} />
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="red" />
                    </Pressable>
                  </View>
                )}
                showsHorizontalScrollIndicator={true}
              />
            </View>
          )}
          {/* Submit Button */}
          <Pressable
            style={styles.submitButton}
            onPress={async () => {
              if (!selectedHazard || !selectedHazardRating || !description || !address) {
                alert("Please fill out all fields.");
                return;
              }
              alert("Hazard is being processed");
              const coords = await geocodeAddress(address);
              if (!coords) {
                alert("Invalid address. Please try again.");
                return;
              }
              try {
                await addDoc(collection(db, "hazards"), {
                  hazard: selectedHazard,
                  rating: selectedHazardRating,
                  description: description,
                  images: images,
                  location: {
                    latitude: coords.lat,
                    longitude: coords.lon,
                  },
                  upvotes: 0,
                  downvotes: 0,
                  timestamp: new Date(),
                });
                alert("Hazard reported successfully!");
              } catch (error) {
                console.error("Error adding document: ", error);
                alert("Error reporting hazard. Please try again.");
              }
              // Reset state after submission
              setSelectedHazard("");
              setSelectedHazardRating("");
              setDescription("");
              setAddress("");
              setImages([]);
            }}
          >
            <Text style={styles.submitButtonText}>Submit Hazard</Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    pageContainer: {
      flex: 1,
      backgroundColor: theme === "dark" ? "#121212" : "white",
    },
    titleContainer: {
      padding: 10,
      alignItems: "center",
      marginTop: 20,
      flex: 1,
      position: "relative",
    },
    settingsButton: {
      position: "absolute",
      top: 25,
      left: 20,
      borderRadius: 10,
      padding: 10,
      zIndex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme === "dark" ? "white" : "black",
    },
    text: {
      fontSize: 20,
      marginTop: 35,
      color: theme === "dark" ? "white" : "black",
    },
    textImage: {
      marginTop: 10,
      fontSize: 14,
      fontWeight: "600",
      color: theme === "dark" ? "#ccc" : "#555",
      marginBottom: 10,
    },
    clearText: {
      marginTop: 8,
      fontSize: 14,
    },
    dropdownContainer: {
      width: "90%",
      marginTop: 20,
      borderWidth: 1,
      borderColor: theme === "dark" ? "#444" : "#ccc",
      borderRadius: 8,
      backgroundColor: theme === "dark" ? "#222" : "#f9f9f9",
    },
    dropdown: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 10,
      borderColor: theme === "dark" ? "#444" : "#ccc",
      backgroundColor: theme === "dark" ? "#222" : "#f9f9f9",
      borderRadius: 8,
    },
    dropdownArrow: {
      marginLeft: 10,
    },
    dropdownMenu: {
      borderRadius: 8,
      borderColor: theme === "dark" ? "#444" : "#ccc",
    },
    dropdownText: {
      color: theme === "dark" ? "white" : "black",
    },
    dropdownMenuText: {
      color: theme === "dark" ? "#eee" : "#000",
    },
    descriptionContainer: {
      width: "90%",
      marginTop: 20,
    },
    descriptionInput: {
      height: 150,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#444" : "#ccc",
      borderRadius: 8,
      padding: 10,
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#f9f9f9",
      fontSize: 16,
      color: theme === "dark" ? "white" : "black",
    },
    wordCount: {
      marginTop: 5,
      fontSize: 14,
      color: theme === "dark" ? "#aaa" : "#666",
      textAlign: "right",
    },
    imageButtonsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 30,
    },
    imageButton: {
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 5,
      marginHorizontal: 5,
      backgroundColor: "#3385FF",
      borderWidth: 1,
    },
    imageButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    flatListContainer: {
      marginTop: 20,
      paddingHorizontal: 10,
    },
    imageItem: {
      marginRight: 10,
      position: "relative",
    },
    pagerImage: {
      width: 200,
      height: 200,
      borderRadius: 10,
      resizeMode: "cover",
    },
    deleteButton: {
      position: "absolute",
      top: 5,
      right: 5,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderRadius: 12,
      zIndex: 1,
    },
    addressInput: {
      textAlignVertical: "left",
      color: theme === "dark" ? "white" : "black",
    },
    addressContainer: {
      width: "90%",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#444" : "#ccc",
      borderRadius: 8,
      padding: 5,
      marginTop: 15,
      marginBottom: 5,
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#f9f9f9",
    },
    submitButton: {
      backgroundColor: "#3385FF",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginTop: 20,
      alignItems: "center",
      zIndex: 10,
      position: "relative",
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });