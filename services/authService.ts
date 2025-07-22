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
    
    if (!userData) {
        throw new Error('User data not found in Firestore');
    }
    
    return {
        uid: user.uid,
        email: user.email,
        role: userData.role,  // No default - must be set when creating user
        displayName: userData.displayName || user.email?.split('@')[0] || 'User'
    };
}

// Sign up
export async function signUp(name: string, email: string, password: string, role: 'owner' | 'worker' = 'owner'): Promise<UserData> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        role,
        displayName: name,
        createdAt: serverTimestamp()
    });

    return await getUserData(userCredential.user);
}

// Create worker account (owner only)
export async function createWorkerAccount(name: string, email: string, password: string): Promise<UserData> {
    const createWorker = httpsCallable(functions, 'createWorkerAccount');
    const result = await createWorker({ name, email, password });
    return result.data as UserData;
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

// Set user role (owner only)
export async function setUserRole(userId: string, role: 'owner' | 'worker'): Promise<void> {
    const setRole = httpsCallable(functions, 'setUserRole');
    await setRole({ userId, role });
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