import React from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, functions } from '../src/firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export interface UserData {
    uid: string;
    email: string | null;
    role: 'owner' | 'worker';
    displayName: string;
}

// Auth state management
let currentUser: UserData | null = null;
const authStateListeners = new Set<(user: UserData | null) => void>();

// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userData = await getUserData(user);
        currentUser = userData;
        notifyAuthStateChange(userData);
    } else {
        currentUser = null;
        notifyAuthStateChange(null);
    }
});

// Helper to get user data including role
async function getUserData(user: User): Promise<UserData> {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (!userData?.role) {
        throw new Error('User role not found');
    }
    
    return {
        uid: user.uid,
        email: user.email,
        role: userData.role, // Don't use default role
        displayName: userData?.displayName || user.email?.split('@')[0] || 'User'
    };
}

// Sign up new owner account
export async function signUp(name: string, email: string, password: string): Promise<UserData> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create the user document with owner role
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName: name,
        role: 'owner',
        createdAt: serverTimestamp()
    });

    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: 'owner',
        displayName: name
    };
}

// Sign in
export async function signIn(email: string, password: string): Promise<UserData> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await getUserData(userCredential.user);
}

// Sign out
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

// Create worker account (owner only)
export async function createWorkerAccount(name: string, email: string, password: string): Promise<UserData> {
    // First check if current user is an owner
    if (!currentUser || currentUser.role !== 'owner') {
        throw new Error('Only owners can create worker accounts');
    }

    const createWorker = httpsCallable(functions, 'createWorkerAccount');
    const result = await createWorker({ name, email, password });
    return result.data as UserData;
}

// Subscribe to auth state changes
export function subscribeToAuthState(callback: (user: UserData | null) => void): () => void {
    authStateListeners.add(callback);
    callback(currentUser); // Initial state
    
    // Return unsubscribe function
    return () => authStateListeners.delete(callback);
}

// Helper to notify all listeners of auth state changes
function notifyAuthStateChange(user: UserData | null) {
    authStateListeners.forEach(listener => listener(user));
}

// Create auth context
const AuthContext = React.createContext<ReturnType<typeof useAuthState> | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuthState();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Internal hook for auth state
function useAuthState() {
    const [user, setUser] = React.useState<UserData | null>(currentUser);

    React.useEffect(() => {
        return subscribeToAuthState(setUser);
    }, []);

    return {
        user,
        signup: signUp, // Alias signUp as signup to match what SignUpPage expects
        login: signIn, // Alias signIn as login to match what LoginPage expects
        logout: signOut,
        createWorkerAccount,
        isAuthenticated: !!user
    };
}

// React hook for auth
export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}