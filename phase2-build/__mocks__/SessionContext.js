import React from 'react';

console.log(">>> USING MANUAL MOCK FOR SESSIONCONTEXT");

const session = {
  type: 'unauthenticated', // or 'unauthenticated' if that's what your app expects
  accountType: 1,
  active: 1, // **MUST BE 1** (falsy like 0 or null will hide pageTitle!)
  currentLocation: {
    latitude: -27.4698,
    longitude: 153.0251,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  searchLocation: null,
  locationPermission: { status: 'granted' },
  sessionStartTime: new Date().toISOString(),
  expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
  uid: 'mock-uid',
};

const SessionContext = React.createContext({
  session,
  updateSession: jest.fn(),
  clearSession: jest.fn(),
  isAuthenticated: () => true,
  login: jest.fn(),
  signUp: jest.fn(),
  logout: jest.fn(),
});

export const SessionProvider = ({ children }) => (
  <SessionContext.Provider value={{
    session,
    updateSession: jest.fn(),
    clearSession: jest.fn(),
    isAuthenticated: () => true,
    login: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
  }}>
    {children}
  </SessionContext.Provider>
);

export const useSession = () => React.useContext(SessionContext);