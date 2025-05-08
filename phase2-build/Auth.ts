import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User, 
  onAuthStateChanged 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

class AuthManager {
  private static instance: AuthManager;
  private auth;
  private currentUser: User | null = null;

  private constructor() {
    // Initialize Firebase App
    const firebaseConfig = {
      // Your Firebase configuration here
    };
    const app = initializeApp(firebaseConfig);

    // Initialize Firebase Authentication
    this.auth = getAuth(app);

    // Restore user session from AsyncStorage
    this.restoreUserSession();
  }

  // Singleton pattern
  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Login
  public async login(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;

      // Save user session to AsyncStorage
      await this.saveUserSession(this.currentUser);

      return this.currentUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Sign-up
  public async signUp(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;

      // Save user session to AsyncStorage
      await this.saveUserSession(this.currentUser);

      return this.currentUser;
    } catch (error) {
      console.error("Sign-up error:", error);
      throw error;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;

      // Clear user session from AsyncStorage
      await AsyncStorage.removeItem("userSession");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Restore user session from AsyncStorage
  private async restoreUserSession(): Promise<void> {
    try {
      const userSession = await AsyncStorage.getItem("userSession");
      if (userSession) {
        this.currentUser = JSON.parse(userSession);
      }
    } catch (error) {
      console.error("Failed to restore user session:", error);
    }
  }

  // Save user session to AsyncStorage
  private async saveUserSession(user: User): Promise<void> {
    try {
      const userSession = JSON.stringify(user);
      await AsyncStorage.setItem("userSession", userSession);
    } catch (error) {
      console.error("Failed to save user session:", error);
    }
  }

  // Listen for auth state changes and update session
  public onAuthStateChanged(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;

      if (user) {
        this.saveUserSession(user).catch((error) => console.error("Failed to save auth state:", error));
      } else {
        AsyncStorage.removeItem("userSession").catch((error) =>
          console.error("Failed to clear auth state:", error)
        );
      }

      callback(user);
    });
  }
}

export default AuthManager;