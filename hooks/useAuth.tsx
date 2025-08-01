import React from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../src/firebaseConfig';

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
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData?.role) {
            // If no role in Firestore, check custom claims
            const idTokenResult = await user.getIdTokenResult();
            const role = idTokenResult.claims.role as 'owner' | 'worker';
            
            if (!role) {
                // Default to owner for first-time users
                console.log('No role found, defaulting to owner');
                return {
                    uid: user.uid,
                    email: user.email,
                    role: 'owner',
                    displayName: user.displayName || user.email?.split('@')[0] || 'User'
                };
            }
            
            return {
                uid: user.uid,
                email: user.email,
                role: role,
                displayName: user.displayName || user.email?.split('@')[0] || 'User'
            };
        }
        
        return {
            uid: user.uid,
            email: user.email,
            role: userData.role,
            displayName: userData?.displayName || user.email?.split('@')[0] || 'User'
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        // Fallback: assume owner role if we can't read from Firestore
        return {
            uid: user.uid,
            email: user.email,
            role: 'owner', // Default fallback
            displayName: user.displayName || user.email?.split('@')[0] || 'User'
        };
    }
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

// Create worker account (owner only) - Client-side version
export async function createWorkerAccount(name: string, email: string, password: string): Promise<UserData> {
    // First check if current user is an owner
    if (!currentUser || currentUser.role !== 'owner') {
        throw new Error('Only owners can create worker accounts');
    }

    try {
        // Create the user account using Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore with worker role
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            displayName: name,
            role: 'worker',
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid
        });

        return {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: 'worker',
            displayName: name
        };
    } catch (error: any) {
        console.error('Error creating worker account:', error);
        
        if (error.code === 'auth/email-already-exists') {
            throw new Error('An account with this email already exists');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak (minimum 6 characters)');
        } else {
            throw new Error('Failed to create worker account: ' + error.message);
        }
    }
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