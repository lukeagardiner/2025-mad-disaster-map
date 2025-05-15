import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage' // facilitates cache reading later

type Theme = 'light' | 'dark'
type ThemeContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const THEME_KEY = 'userAppTheme'; // Key for AsyncStorage for local user cache to be implemented

// theme data type
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export from class
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    //Can set start preference here
    const systemColorScheme = useColorScheme();
    // default and updated below
    //const [theme, setTheme] = useState<Theme>(systemColorScheme === "dark" ? "dark" : "light");
    const [theme, setThemeState] = useState<Theme>('light');

    // Load from cache on application mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const cachedTheme = await AsyncStorage.getItem(THEME_KEY); // value of theme in cache
                if ( cachedTheme === 'dark' || cachedTheme === 'light' ) {
                    setThemeState(cachedTheme); // bind app theme to preference
                }
                else {
                    setThemeState('light'); // Default and startup value
                }
            } catch (e) {
                // if something not working like cache not there
                setThemeState('light');
            }
        };
        // do the load business
        loadTheme();
    }, []);

    // Method to give the facility to save the theme whenever it changes
    const setTheme = ( newTheme: Theme ) => {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};