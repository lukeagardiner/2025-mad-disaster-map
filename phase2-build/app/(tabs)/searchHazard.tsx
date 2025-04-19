import { View, Text, StyleSheet } from 'react-native';

export default function SearchHazardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search a Hazard Page</Text>
    </View>
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