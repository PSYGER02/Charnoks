import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../src/firebaseConfig';t, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../src/firebaseConfig';

interface User {
    uid: string;
    email: string;
    name: string;
    role: 'owner' | 'worker';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    createWorker: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      
      // Create user document in Firestore with owner role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'owner',
        createdAt: serverTimestamp()
      });

      // Force token refresh to get new claims
      await userCredential.user.getIdToken(true);

      // Return the user data
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        role: 'owner' as const
      };
      
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to create owner account');
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

  const createWorkerAccount = useCallback(async (name: string, email: string, password: string) => {
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

  const value = useMemo(() => ({ user, loading, login, signup, logout, createWorkerAccount }), [user, loading, login, signup, logout, createWorkerAccount]);

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

// pages/SignUpPage.tsx
const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    setIsSigningUp(true);
    try {
        // Create the authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Call the Cloud Function to set up the owner account
        const createOwner = httpsCallable(functions, 'createOwnerAccount');
        await createOwner({
            uid: userCredential.user.uid,
            email,
            name
        });
        
        // Force a token refresh to get the new claims
        await userCredential.user.getIdToken(true);
        
        // Navigate to owner dashboard
        navigate('/owner/dashboard', { replace: true });
    } catch (err: any) {
        setError(err.message || "Failed to create an account. Please try again.");
    } finally {
        setIsSigningUp(false);
    }
};
