import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PermissionResponse } from 'expo-location';


// Setup user session types
type SessionType = 'authenticated' | 'unauthenticated';

// For passing session data to other parts of application
interface SessionData {
    type: SessionType;
    currentLocation: {
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
}

// KEY for cache when implemented
const SESSION_KEY = 'userAppSession';

// Default session constructor / fallback logic
const defaultSession: SessionData = {
    type: 'unauthenticated',
    currentLocation: null,
    locationPermission: undefined, // Default to undefined
    sessionStartTime: null,
    expiry: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({children}: {children: ReactNode}) => {
    const [session, setSession] = useState<SessionData>(defaultSession);

    // Check the cache for loadable session when we statup
    useEffect(() => {
        const loadSession = async () => {
            try {
                const cachedSession  = await AsyncStorage.getItem(SESSION_KEY);
                // if found
                if (cachedSession) {
                    const parsedSession: SessionData = JSON.parse(cachedSession);

                    // Run check to see if retrieved session is expired
                    if (parsedSession.expiry && new Date(parsedSession.expiry) < new Date()) {
                        console.log('Session expired, clearing session.');
                        clearSession();
                    }
                    else {
                        setSession(parsedSession);
                    }
                }
            } catch (e) {
                console.error('Failed to load session from cache:', e);

            }
        };

        // Now it is time to load the session
        loadSession();
    }, []);

    // Also need to be able to save session to cache whenever it changes
    useEffect(() =>  {
        const saveSession = async () => {
            try {
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
            catch (e) {
                console.error('Failed to save session to cache:', e);
            }
        };

        // Now it is time to save the session
        saveSession();
    }, [session]);

    // Update session
    const updateSession = (data: Partial<SessionData>) => {
        setSession((prev) => ({
            ...prev,
            ...data,
        }));
    };

    // Clear session
    const clearSession = () => {
        setSession(defaultSession);
        AsyncStorage.removeItem(SESSION_KEY).catch((e) =>
            console.error('Failed to clear session from cache:', e)
        );
    };

    // Return function / structure
    return (
        <SessionContext.Provider value = {{ session, updateSession, clearSession }}>
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
    return context
};