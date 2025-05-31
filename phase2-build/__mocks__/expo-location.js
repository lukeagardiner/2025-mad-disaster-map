module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockImplementation(() => {
    console.log('expo-location: requestForegroundPermissionsAsync called');
    return Promise.resolve({ status: 'granted' });
  }),
  getCurrentPositionAsync: jest.fn().mockImplementation(() => {
    console.log('expo-location: getCurrentPositionAsync called');
    return Promise.resolve({
      coords: { latitude: -27.4698, longitude: 153.0251 },
    });
  }),
  getProviderStatusAsync: jest.fn().mockImplementation(() => {
    console.log('expo-location: getProviderStatusAsync called');
    return Promise.resolve({ locationServicesEnabled: true });
  }),
  Accuracy: { High: 3 },
};