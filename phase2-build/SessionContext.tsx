import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app, firebaseConfig } from './firebase.js'; // Import Firebase app and config
import { PermissionResponse } from 'expo-location';

const db = getFirestore(app); // Firestore instance

// Setup user session types
type SessionType = 'authenticated' | 'unauthenticated';

// For passing session data to other parts of application
interface SessionData {
  type: SessionType;
  accountType: number | null; 
  active: number | null; 
  currentLocation: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  searchLocation: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  locationPermission?: PermissionResponse; // Store the full permission object to pass permissions to all components inside the app
  sessionStartTime: string | null;
  expiry: string | null;
}

// For passing the actual session if required
interface SessionContextType {
  session: SessionData;
  updateSession: (data: Partial<SessionData>) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// KEY for cache when implemented
const SESSION_KEY = 'userAppSession';

// Default session constructor / fallback logic
const defaultSession: SessionData = {
  type: 'unauthenticated',
  accountType: null, 
  active: null, 
  currentLocation: null,
  searchLocation: null,
  locationPermission: undefined, // Default to undefined
  sessionStartTime: null,
  expiry: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionData>(defaultSession);
  const auth = getAuth(app); // Initialize Firebase Authentication using the Firebase app

  // Restore session from cache on app startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const cachedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (cachedSession) {
          const parsedSession: SessionData = JSON.parse(cachedSession);

          if (parsedSession.expiry) {
            if (new Date(parsedSession.expiry) < new Date()) {
              console.log(`Session expired at ${parsedSession.expiry}. Clearing session.`);
              clearSession();
            } else {
              setSession(parsedSession);
            }
          } else {
            setSession(parsedSession);
          }
        }
      } catch (e) {
        console.error('Failed to load session from cache:', e);
      }

      onAuthStateChanged(auth, (user) => {
        if (user) {
          setSession((prev) => ({
            ...prev,
            type: 'authenticated',
            sessionStartTime: new Date().toISOString(),
            expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
          }));
        } else {
          clearSession();
        }
      });
    };

    loadSession();
  }, []);

  // Save session to cache whenever it changes
  useEffect(() => {
    const saveSession = async () => {
      if (session.type === 'unauthenticated' && !session.sessionStartTime) {
        return;
      }
      try {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.error('Failed to save session to cache:', e);
      }
    };

    saveSession();
  }, [session]);

  // Update session
  const updateSession = (data: Partial<SessionData>) => {
    setSession((prev) => ({ ...prev, ...data }));
  };

  // Clear session
  const clearSession = () => {
    setSession(defaultSession);
    AsyncStorage.removeItem(SESSION_KEY).catch((e) =>
      console.error('Failed to clear session from cache:', e)
    );
  };

  // Check if user is authenticated
  const isAuthenticated = () => session.type === 'authenticated';

  // Login using Firebase
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Adding credential fetch
      const userDoc = doc(db, 'users', userCredential.user.uid);
      const userSnapshot = await getDoc(userDoc);

      let accountType = null;
      let active = null;
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        accountType = userData.accountType || null; 
        active = userData.active || null; 
      }

      // Build authenticated session
      const newSession = {
        type: 'authenticated' as SessionType, // Explicitly cast as SessionType
        sessionStartTime: new Date().toISOString(),
        expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // 1-hour expiry
        accountType,
        active,
      };

      setSession((prev) => ({ ...prev, ...newSession }));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, ...newSession }));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Sign-up using Firebase
  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newSession = {
        type: 'authenticated' as SessionType, // Explicitly cast as SessionType
        sessionStartTime: new Date().toISOString(),
        expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // 1-hour expiry
        // default starting user values
        accountType: 1, 
        active: 1,
      };

      setSession((prev) => ({ ...prev, ...newSession }));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, ...newSession }));

      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, {
        accountType: 1,
        active: 1,
      });

    } catch (error) {
      console.error('Sign-up failed:', error);
      throw error;
    }
  };

  // Logout using Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      clearSession();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{ session, updateSession, clearSession, isAuthenticated, login, signUp, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// Last export
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};