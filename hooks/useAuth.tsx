import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../src/firebaseConfig';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'worker';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createWorker: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Firebase user to our User interface
const convertFirebaseUser = (firebaseUser: FirebaseUser, customClaims: any): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: customClaims?.name || firebaseUser.displayName || 'Unknown',
    role: customClaims?.role || 'worker'
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the user's custom claims (including role)
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const customClaims = idTokenResult.claims;
          
          const userData = convertFirebaseUser(firebaseUser, customClaims);
          setUser(userData);
        } catch (error) {
          console.error('Error getting user claims:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const createUserDoc = httpsCallable(functions, 'createUserDocument');
      await createUserDoc({ name, email });
      
      // Set the user as owner (first user to signup becomes owner)
      const setRole = httpsCallable(functions, 'setUserRole');
      await setRole({ targetUid: userCredential.user.uid, newRole: 'owner' });
      
      // Force token refresh to get new claims
      await userCredential.user.getIdToken(true);
      
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Signup failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }, []);

  const createWorker = useCallback(async (name: string, email: string, password: string) => {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore (will default to worker role)
      const createUserDoc = httpsCallable(functions, 'createUserDocument');
      await createUserDoc({ name, email });
      
      // Sign out the newly created user so the owner stays logged in
      await signOut(auth);
      
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create worker account');
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, signup, logout, createWorker }), [user, loading, login, signup, logout, createWorker]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
