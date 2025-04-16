import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Settings() {
  return (
    <>
      {/* Customize the header */}
      <Stack.Screen
        options={{
          headerBackTitle: "Back", // This sets the back button label to "Back"
          headerTitle: "Settings", // This sets the title of the screen to "Settings"
          headerTitleStyle: { fontSize: 20 }, // This sets the font size of the title to 20
        }}
      />
      {/* Rest of your Settings screen content */}
      <View style={styles.container}>
        <Text>Settings Screen</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
  },
});