import { View, Text, StyleSheet, Pressable, GestureResponderEvent, TextInput, Keyboard, Button, TouchableWithoutFeedback, Image, Dimensions, FlatList } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { firebaseConfig } from '@/firebase';

const app=initializeApp(firebaseConfig); // Initialize Firebase app
const db = getFirestore(); // Initialize Firestore instance once

/* 
  Also install these modules:  
*/
//npm install @expo/vector-icons
//npm install expo-image-picker
//npm install expo-router

// TODO
//-include address input
//-be triggered from pin in index or search page
//-acquire dynamic hazard def from firestore


export default function ReportHazardScreen() {
  const descriptionRef = useRef(null); // Reference to the description input field
  const [selectedHazard, setSelectedHazard] = useState(''); // State to track the selected hazard
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Tracks dropdown state
  const [description, setDescription] = useState(''); // Tracks the description state
  const [images, setImages] = useState<string[]>([]); // State to track the selected images (URIs)
  const hazardOptions = ['Flood', 'Fallen Tree', 'Fallen Powerline', 'Fire']; // Hazard options for the dropdown list
  const MAX_WORD_COUNT = 256; // Maximum word count for the description
  const MAX_IMAGES = 3; // Maximum number of images allowed

  // Function to clear the selected hazard when the user presses the "Clear Selection" button
  // This function resets the dropdown selection to the default value
  function clearSelection(event: GestureResponderEvent): void {
    setSelectedHazard(''); // Clear the selected hazard state
  }
  // Function to count the number of words in a given text
  // This function splits the text by whitespace and returns the length of the resulting array
  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/); 
    return words.length; // Return the word count
  };

  // Function to handle changes in the description input field
  const handleDescriptionChange = (text: string) => {
    const wordCount = countWords(text); // Count the words in the input text
    if (wordCount <= MAX_WORD_COUNT) {
      setDescription(text); // Update the description state if within limit
    } else {
      alert(`Maximum word count is ${MAX_WORD_COUNT}`); // Alert the user if exceeding limit
    }
  };
  // Function to pick an image from the device's media library
  const pickImage = async () => {
    // Request permission to access the media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    // Launch the image picker to select an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });
    // Check if the user canceled the image selection
    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri); // Extract URIs from selected assets
      setImages((prevImages) => {
        const newImages = [...prevImages, ...selectedImages]; // Combine previous and new images
        return newImages.slice(0, MAX_IMAGES); // Limit to the maximum number of images
      });
    }
  };
  // Function to take a photo using the camera
  const takePhoto = async () => {
    // Request permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required!');
      return;
    }
    // Launch the camera to take a photo
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
    });
    // Check if the user canceled the image selection
    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri); // Extract URIs from selected assets
      setImages((prevImages) => {
        const newImages = [...prevImages, ...selectedImages]; // Combine previous and new images
        return newImages.slice(0, MAX_IMAGES); // Limit to the maximum number of images
      });
    }
  };

  // Function to delete an image from the selected images list
  const handleDeleteImage = (indexToDelete: number) => {
    setImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToDelete)
    );
  };

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
      {/*Dismiss keyboard when tapping outside of TextInput*/}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}> 
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Disaster Map</Text>
          <Text style={styles.text}>Report a Hazard Page</Text>

          {/* Custom Dropdown Container */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {selectedHazard || 'Select a Hazard'}
              </Text>
              <Ionicons
                // Icon for dropdown arrow
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} 
                size={20}
                color="black"
                style={styles.dropdownArrow}
              />
            </Pressable>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {/* Map through hazard options and create Pressable items */}
                {hazardOptions.map((hazardRef, index) => (
                  <Pressable
                    key={index}
                    style={{ padding: 10 }}
                    onPress={() => {
                      setSelectedHazard(hazardRef); // Set selected hazard
                      setIsDropdownOpen(false); // Close dropdown
                    }}>
                    <Text style={styles.dropdownMenuText}>{hazardRef}</Text> 
                  </Pressable>
                ))}
              </View>
            )}
          </View>
            
            {/* Clear Selection Button */}
            {/* This button clears the selected hazard when pressed */}
          <Pressable style={styles.clearText} onPress={clearSelection}>
            <Text>Clear Selection</Text>
          </Pressable>
          {/* Display selected hazard text */}
          {/* This text shows the currently selected hazard, if any */}
          {selectedHazard ? (
            <Text style={styles.selectedText}>
              Selected: {selectedHazard}
            </Text>
          ) : null}

          {/*Description Input field*/}
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter a description (max 256 words)" // Placeholder text
              value={description}
              ref={descriptionRef} // Reference to the description input field
              onChangeText={handleDescriptionChange} // Handle text input changes
              multiline // Allow multiline input
              maxLength={256} // Limit to 256 characters
              textAlignVertical="top" // Align text to the top of the input field
            />
            <Text style={styles.wordCount}>
              {/* Display word count and maximum word count */}
              {/* This text shows the current word count and the maximum allowed */}
              Word Count: {countWords(description)} / {MAX_WORD_COUNT} 
            </Text>
          </View>
          
          <Text style={styles.textImage}>Upload Images</Text>
          {/* Image Upload Buttons: This step works */}
          <View style={styles.imageButtonsContainer}>
            <Pressable style={styles.imageButton} onPress={pickImage}>
              {/* Pick Image from Gallery */}
              <Text style={styles.imageButtonText}>Image from Gallery</Text>
            </Pressable>
            <Pressable style={styles.imageButton} onPress={takePhoto}>
              {/* Take Photo using Camera */}
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </Pressable>
          </View>

          {/* Display uploaded images with delete option */}
          {images.length > 0 && (
            <View style={styles.flatListContainer}>
              <FlatList
                data={images}
                horizontal // Display images horizontally                
                keyExtractor={(item, index) => index.toString()}
                // Render each image with delete button
                // This function renders each image in the FlatList
                renderItem={({ item, index }) => (
                  <View style={styles.imageItem}>
                    <Image source={{ uri: item }} style={styles.pagerImage} />
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteImage(index)} // Delete image
                    >
                      <Ionicons name="close-circle" size={24} color="red" />
                    </Pressable>
                  </View>
                )}
                showsHorizontalScrollIndicator={true} // Hide horizontal scroll indicator
              />
            </View>
          )}
          {/* Submit Button */}
          <Pressable
            style={styles.submitButton}
            onPress={async () => {
              // Firestore instance is already initialized at a higher scope
              // Check if a hazard is selected and description is provided
              if (!selectedHazard || !description) {
                alert('Please select a hazard and provide a description.'); // Alert if not
                return;
              }
              else{
                try {
                  // Add a new document to the "hazards" collection in Firestore
                  await addDoc(collection(db, 'hazards'), {
                    hazard: selectedHazard,
                    description: description,
                    images: images,
                  });
                  alert('Hazard reported successfully!'); // Alert on success
                } catch (error) {
                  console.error('Error adding document: ', error); // Log error
                  alert('Error reporting hazard. Please try again.'); // Alert on error
                }
              }
              // Reset state after submission
              setSelectedHazard(''); // Clear selected hazard
              setDescription(''); // Clear description
            }}>
            <Text style={styles.imageButtonText}>Submit Hazard</Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  titleContainer: {
    padding: 10,
    alignItems: 'center',
    marginTop: 47,
    flex: 1,
    position: 'relative',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Roboto',
  },
  text: {
    fontSize: 20,
    marginTop: 35,
    fontFamily: 'Roboto',
  },
  textImage:{
    fontSize: 16,
    marginTop: 20,
  },
  clearText: {
    marginTop: 8,
    fontSize: 16,
    color: 'blue',
  },
  dropdownContainer: {
    width: '80%',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: 'black',
    fontFamily: 'Roboto',
  },
  dropdownArrow: {
    marginLeft: 10,
  },
  dropdownMenu: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  dropdownMenuText: {
    fontSize: 16,
    color: 'black',
    fontFamily: 'Roboto',
  },
  selectedText: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
    fontFamily: 'Roboto',
  },
  descriptionContainer: {
    width: '80%',
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
  wordCount: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontFamily: 'Roboto',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButton:{
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    width: '60%',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  flatListContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  imageItem: {
    marginRight: 10,
    position: 'relative',
  },
  pagerImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    zIndex: 1,
  },
});