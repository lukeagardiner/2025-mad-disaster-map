import { View, Text, StyleSheet, Pressable, GestureResponderEvent, TextInput, Keyboard, Button, TouchableWithoutFeedback, Image, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ModalDropdown from 'react-native-modal-dropdown';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
/* 
  Also install these modules:  
*/
//npm install react-native-pager-view
//npm install react-native-modal-dropdown
//npm install @expo/vector-icons
//npm install expo-image-picker
//npm install react-native-pager-view


export default function ReportHazardScreen() {
  const [selectedHazard, setSelectedHazard] = useState(''); // State to track the selected hazard
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Tracks dropdown state
  const [description, setDescription] = useState(''); // Tracks the description state
  const hazardOptions = ['Flood', 'Fallen Tree', 'Fallen Powerline', 'Fire']; // Hazard options for the dropdown list
  const [images, setImages] = useState<string[]>([]); // State to track the selected images (URIs)
  const dropdownRef = useRef<ModalDropdown>(null); // Ref to access the dropdown component
  const MAX_WORD_COUNT = 256; // Maximum word count for the description
  const MAX_IMAGES = 3; // Maximum number of images allowed

  // Get screen width for pager item sizing
  const { width: screenWidth } = Dimensions.get('window');
  const pagerItemWidth = screenWidth * 0.8; // 80% of screen width for each image

  // Function to open the dropdown when the user presses the picker container
  const openDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.show();
    }
  };
  // Function to clear the selected hazard when the user presses the "Clear Selection" button
  // This function resets the dropdown selection to the default value
  function clearSelection(event: GestureResponderEvent): void {
    if (dropdownRef.current) {
      dropdownRef.current?.select(-1); // Reset the dropdown selection to no option
    }
    setSelectedHazard(''); // Clear the selected hazard state
    setIsDropdownOpen(false); // Close the dropdown
  }

  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/); // Split the text into words using whitespace as a delimiter
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

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri); // Extract URIs from selected assets
      setImages(selectedImages); // Update the images state with selected URIs
    }
  }

  const takePhoto = async () => {
    // Request permission to access the camera
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
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
    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri); // Extract URIs from selected assets
      setImages(selectedImages); // Update the images state with selected URIs
    }
  }


  return (
    <View style={styles.pageContainer}>
        {/*Settings Button*/}
        <Pressable
          onPress={() => {
            console.log('Navigating to settings'); // Debug: Log navigation
            router.push("/settings");
          }}
          style={styles.settingsButton}
        >
          <Ionicons name="settings" size={24} color="black" />
        </Pressable>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Disaster Map</Text>
          <Text style={styles.text}>Report a Hazard Page</Text>
          {/* Dropdown Container */}
          <Pressable style={styles.dropdownContainer} onPress={openDropdown}>
            <ModalDropdown
              ref={dropdownRef}
              options={hazardOptions}
              defaultValue="Select a Hazard"
              onSelect={(index, value) => setSelectedHazard(value)}
              onDropdownWillShow={() => setIsDropdownOpen(true)}
              onDropdownWillHide={() => setIsDropdownOpen(false)}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropdownStyle={styles.dropdownMenu}
              dropdownTextStyle={styles.dropdownMenuText}
            />
            {/* Down Arrow Icon (toggles direction) */}
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} // Icon to indicate dropdown state
              size={20}
              color="black"
              style={styles.dropdownArrow}
            />
          </Pressable>
          <Pressable style={styles.clearText} onPress={clearSelection}> // Clear Selection Button
            <Text>Clear Selection</Text> // This button clears the selected hazard
          </Pressable>
          {/* Display the selected hazard (optional, for debugging) */}
          {selectedHazard ? (
            <Text style={styles.selectedText}>Selected: {selectedHazard}</Text>
          ) : null}
          {/*Description Input field*/}
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter a description (max 256 words)" // Placeholder text
              value={description} 
              onChangeText={handleDescriptionChange} // Handle text input changes
              multiline // Allow multiline input
              maxLength={256} // Limit to 256 characters
              textAlignVertical='top' // Align text to the top of the input field
            />
            <Text style={styles.wordCount}>
              Word Count: {countWords(description)} / {MAX_WORD_COUNT}
            </Text>
          </View>
          

          {/* Image Upload Buttons: This step works */}
          <View style={styles.imageButtonsContainer}>
            <Pressable style={styles.imageButton} onPress={pickImage}> // Pick Image from Gallery
              <Text style={styles.imageButtonText}>Pick from Gallery</Text>
            </Pressable>
            <Pressable style={styles.imageButton} onPress={takePhoto}> // Take Photo using Camera
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </Pressable>
          </View>

          {/* Image PagerView (Carousel) : Not Working */}
          {images.length > 0 && ( // Only show if images are selected
            <View style={styles.pagerContainer}>
              <PagerView
                style={{ height: 220, width: pagerItemWidth }}
                initialPage={0}
              >
                {images.map((imageUri, index) => ( // Map through selected images
                  <View key={index} style={styles.pagerItem}>
                    <Image source={{ uri: imageUri }} style={styles.pagerImage} />
                  </View>
                ))}
              </PagerView>
            </View>
          )}
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
    padding: 10, // Adds padding around the title
    alignItems: 'center', // Centers the title horizontally
    marginTop: 45,
  },
  settingsButton: { // Adds a settings button to the top left corner
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24, // Larger font size for the title
    fontWeight: 'bold', // Makes the title bold
    color: 'black', // White color for the title
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    marginTop: 55,
  },
  clearText: {
    marginTop: 8,
    fontSize: 16,
    color: 'blue',
  },
  dropdownContainer: {
    width: '80%', // Sets the width of the picker container
    marginTop: 40, // Adds margin above the picker
    borderWidth: 1, // Adds a border around the picker container
    borderColor: '#ccc', // Light gray color for the border
    borderRadius: 5, // Rounds the corners of the border
  },
  dropdown: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: 'black',
  },
  dropdownMenu: {
    width: '80%',
    height: 150, // Adjust the height of the dropdown menu
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropdownMenuText: {
    fontSize: 16,
    color: 'black',
    padding: 10,
  },
  dropdownArrow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }], //Centres the arrow vertically
  },
  selectedText: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
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
  },
  wordCount: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
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
  imageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  pagerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});
