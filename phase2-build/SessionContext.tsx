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
    isAuthenticated: () => boolean;
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
                if (!SESSION_KEY) {
                    throw new Error('SESSION_KEY is not defined. Cannot load or save session.');
                }

                const cachedSession  = await AsyncStorage.getItem(SESSION_KEY);
                if (cachedSession) {
                    const parsedSession: SessionData = JSON.parse(cachedSession);

                    if (parsedSession.expiry) {
                        console.log('Checking session expiry:', parsedSession.expiry);
                        if (new Date(parsedSession.expiry) < new Date()) {
                            console.log(`Session expired at ${parsedSession.expiry}. Clearing session.`);
                            clearSession();
                        } else {
                            setSession(parsedSession);
                        }
                    } else {
                        console.log('No expiry set. Assuming session is valid.');
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
            if (session.type === 'unauthenticated' && !session.sessionStartTime) {
                console.log('Default session detected. Skipping save to cache.');
                return;
            }
            try {
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
                console.log('Session saved to cache:', session);
            } catch (e) {
                console.error('Failed to save session to cache:', e);
            }
        };

        // Now it is time to save the session
        saveSession();
    }, [session]);

    // Update session
    const updateSession = (data: Partial<SessionData>) => {
        console.log('Previous Session:', session);
        setSession((prev) => {
            const updatedSession = { ...prev, ...data };
            console.log('Updated Session:', updatedSession);
            return updatedSession;
        });
    };

    // Clear session
    const clearSession = () => {
        console.log('Clearing Session...');
        setSession(defaultSession);
        AsyncStorage.removeItem(SESSION_KEY).catch((e) =>
            console.error('Failed to clear session from cache:', e)
        );
        console.log('Session Cleared:', defaultSession);
    };

    const isAuthenticated = () => session.type === 'authenticated';

    return (
        <SessionContext.Provider value={{ session, updateSession, clearSession, isAuthenticated }}>
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