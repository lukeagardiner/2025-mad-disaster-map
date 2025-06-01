/*
###################################################################
## -- MOCKS AND IMPORTS --                                    ##
###################################################################
*/

import React from 'react';
import { Text } from 'react-native';

jest.mock('@expo/vector-icons');
jest.mock('expo-font');
jest.mock('expo-font/memory');
jest.mock('expo-router');
jest.mock('expo-location'); 
jest.mock('@react-native-async-storage/async-storage'); 

// Force the use of our mocks from __mocks__ directory!
jest.mock('../SessionContext', () => require('../__mocks__/SessionContext.js'));
//jest.mock('@/theme/ThemeContext');
jest.mock('@/theme/ThemeContext', () => ({
  __esModule: true,
  useTheme: () => ({ theme: 'light' }), 
  ThemeProvider: ({ children }) => children, // Need to add this passthrough due to object structure
}));

// Gets the real component for screen render but populates with mocked hazard
jest.mock('../app/(tabs)/index', () => {
  const originalModule = jest.requireActual('../app/(tabs)/index');
  return {
    __esModule: true,
    ...originalModule,
    default: originalModule.default,
    fetchHazards: jest.fn().mockResolvedValue([]),
  };
});

/*
###################################################################
## -- DEBUG LOGS --                                    ##
###################################################################
*/

// Logging for debugging
//console.log("expo-vector-icons mock:", require('@expo/vector-icons'));
//console.log("expo-font mock:", require('expo-font'));
//console.log("expo-font/memory mock:", require('expo-font/memory'));
//console.log("expo-router mock:", require('expo-router'));
//console.log("SessionContext mock:", require('../SessionContext'));
//console.log("ThemeContext mock:", require('@/theme/ThemeContext'));
//console.log("IndexScreen mock:", require('../app/(tabs)/index'));

/*
###################################################################
## -- UNIT TESTS --                                    ##
###################################################################
*/

import { render, waitFor, screen } from '@testing-library/react-native';
import IndexScreen from '../app/(tabs)/index';
import { useSession, SessionProvider } from '../SessionContext';
import { ThemeProvider } from '../theme/ThemeContext';
import { fireEvent } from '@testing-library/react-native';
import Layout from '../app/(tabs)/_layout';

function ContextTestComponent() {
  const ctx = useSession();
  console.log('SessionContext value:', ctx);
  return <Text>Context Test</Text>;
}

// Session context object test
test('SessionContext provides value', () => {
  render(
    <SessionProvider>
      <ContextTestComponent />
    </SessionProvider>
  );
});

// Disaster map page renter test
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

// Login/Register page navigation test
test('navigates to Login tab', async () => {
  const { getByText, findByText } = render(
    <SessionProvider>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
    </SessionProvider>
  );

  fireEvent.press(getByText('Login'));

  expect(await findByText('Login or Sign up Today!')).toBeTruthy();
});