import React from 'react';
import { Text } from 'react-native';

jest.mock('@expo/vector-icons');
jest.mock('expo-font');
jest.mock('expo-font/memory');
jest.mock('expo-router');
jest.mock('expo-location'); // Add this if you use expo-location!
jest.mock('@react-native-async-storage/async-storage'); // Add if needed.

// Use the mocks from __mocks__ directory!
jest.mock('../SessionContext', () => require('../__mocks__/SessionContext.js'));
//jest.mock('@/theme/ThemeContext');
jest.mock('@/theme/ThemeContext', () => ({
  __esModule: true,
  useTheme: () => ({ theme: 'light' }), // mock the return value as needed
  ThemeProvider: ({ children }) => children, // optional: passthrough
}));

// This one is fine, since you want the real component but a fake fetchHazards.
jest.mock('../app/(tabs)/index', () => {
  const originalModule = jest.requireActual('../app/(tabs)/index');
  return {
    __esModule: true,
    ...originalModule,
    default: originalModule.default,
    fetchHazards: jest.fn().mockResolvedValue([]),
  };
});

// Logging for debugging
console.log("expo-vector-icons mock:", require('@expo/vector-icons'));
console.log("expo-font mock:", require('expo-font'));
console.log("expo-font/memory mock:", require('expo-font/memory'));
console.log("expo-router mock:", require('expo-router'));
console.log("SessionContext mock:", require('../SessionContext'));
console.log("ThemeContext mock:", require('@/theme/ThemeContext'));
console.log("IndexScreen mock:", require('../app/(tabs)/index'));

import { render, waitFor, screen } from '@testing-library/react-native';
import IndexScreen from '../app/(tabs)/index';
import { useSession, SessionProvider } from '../SessionContext';
import { ThemeProvider } from '../theme/ThemeContext';

function ContextTestComponent() {
  const ctx = useSession();
  console.log('SessionContext value:', ctx);
  return <Text>Context Test</Text>;
}

test('SessionContext provides value', () => {
  render(
    <SessionProvider>
      <ContextTestComponent />
    </SessionProvider>
  );
});

test('renders Disaster Map title', async () => {
  const { getByText, getByTestId, queryByTestId, toJSON } = render(
    <SessionProvider>
      <ThemeProvider>
        <IndexScreen />
      </ThemeProvider>
    </SessionProvider>
  );
  screen.debug();
  console.log(toJSON());

  await waitFor(() => {
    expect(queryByTestId('loading-indicator')).toBeNull();
  }, { timeout: 10000 });
  screen.debug();
  console.log(toJSON());

  expect(getByTestId('pageTitle')).toBeTruthy();
});