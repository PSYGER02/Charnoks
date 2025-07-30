/**
 * Unified Authentication Service
 * Consolidates all authentication logic into a single service
 * Replaces duplicate logic in hooks/useAuth.tsx and services/authService.ts
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    IdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../src/firebaseConfig';
import { ErrorHandler, AppError } from '../utils/errorHandler';

export interface UserData {
    uid: string;
    email: string | null;
    role: 'owner' | 'worker';
    displayName: string;
}

/**
 * Authentication state change listener type
 */
type AuthStateListener = (user: UserData | null) => void;

/**
 * Unified Authentication Service (Singleton)
 */
class AuthService {
    private static instance: AuthService;
    private currentUser: UserData | null = null;
    private listeners = new Set<AuthStateListener>();
    private initialized = false;

    private constructor() {
        this.initializeAuthListener();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Initialize Firebase auth state listener
     */
    private initializeAuthListener(): void {
        if (this.initialized) return;

        onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const userData = await this.getUserData(user);
                    this.currentUser = userData;
                    this.notifyListeners(userData);
                } else {
                    this.currentUser = null;
                    this.notifyListeners(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                this.currentUser = null;
                this.notifyListeners(null);
            }
        });

        this.initialized = true;
    }

    /**
     * Enhanced user data retrieval with fallbacks and custom claims
     */
    private async getUserData(user: User): Promise<UserData> {
        try {
            // First, try to get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            if (userData?.role) {
                return {
                    uid: user.uid,
                    email: user.email,
                    role: userData.role,
                    displayName: userData.displayName || user.email?.split('@')[0] || 'User'
                };
            }

            // If no role in Firestore, check custom claims
            const idTokenResult = await user.getIdTokenResult();
            const role = idTokenResult.claims.role as 'owner' | 'worker';

            if (role) {
                // Create/update user document with role from custom claims
                await this.createOrUpdateUserDocument(user, role);
                
                return {
                    uid: user.uid,
                    email: user.email,
                    role: role,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User'
                };
            }

            // If no role anywhere, this is likely a new user - assign default role
            const defaultRole = 'worker';
            await this.createOrUpdateUserDocument(user, defaultRole);
            
            // Set custom claims via Cloud Function
            try {
                const setRoleFn = httpsCallable(functions, 'setUserRole');
                await setRoleFn({ targetUid: user.uid, newRole: defaultRole });
            } catch (error) {
                console.warn('Failed to set custom claims:', error);
            }

            return {
                uid: user.uid,
                email: user.email,
                role: defaultRole,
                displayName: user.displayName || user.email?.split('@')[0] || 'User'
            };

        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'getUserData',
                userId: user.uid
            });
        }
    }

    /**
     * Create or update user document in Firestore
     */
    private async createOrUpdateUserDocument(user: User, role: 'owner' | 'worker'): Promise<void> {
        try {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                role: role,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Failed to create/update user document:', error);
            // Don't throw here as this is a fallback operation
        }
    }

    /**
     * Sign up new user (defaults to owner role)
     */
    async signUp(name: string, email: string, password: string): Promise<UserData> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user document with owner role (for signup, assume owner)
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email,
                displayName: name,
                role: 'owner',
                createdAt: serverTimestamp()
            });

            // Set custom claims
            try {
                const setRoleFn = httpsCallable(functions, 'setUserRole');
                await setRoleFn({ targetUid: userCredential.user.uid, newRole: 'owner' });
            } catch (error) {
                console.warn('Failed to set owner custom claims:', error);
            }

            return {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                role: 'owner',
                displayName: name
            };
        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'signUp',
                additionalData: { email, name }
            });
        }
    }

    /**
     * Sign in existing user
     */
    async signIn(email: string, password: string): Promise<UserData> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return await this.getUserData(userCredential.user);
        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'signIn',
                additionalData: { email }
            });
        }
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'signOut',
                userId: this.currentUser?.uid
            });
        }
    }

    /**
     * Create worker account (owner only)
     */
    async createWorkerAccount(name: string, email: string, password: string): Promise<UserData> {
        if (!this.currentUser || this.currentUser.role !== 'owner') {
            throw ErrorHandler.handleBusinessLogicError(
                'permission-denied',
                'Only owners can create worker accounts',
                { requiredRole: 'owner', currentRole: this.currentUser?.role }
            );
        }

        try {
            const createWorkerFn = httpsCallable(functions, 'createWorkerAccount');
            const result = await createWorkerFn({ name, email, password });
            return result.data as UserData;
        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'createWorkerAccount',
                userId: this.currentUser.uid,
                additionalData: { email, name }
            });
        }
    }

    /**
     * Set user role (owner only)
     */
    async setUserRole(targetUid: string, newRole: 'owner' | 'worker'): Promise<void> {
        if (!this.currentUser || this.currentUser.role !== 'owner') {
            throw ErrorHandler.handleBusinessLogicError(
                'permission-denied',
                'Only owners can change user roles',
                { requiredRole: 'owner', currentRole: this.currentUser?.role }
            );
        }

        try {
            const setRoleFn = httpsCallable(functions, 'setUserRole');
            await setRoleFn({ targetUid, newRole });
        } catch (error) {
            throw ErrorHandler.handleFirebaseError(error, {
                operation: 'setUserRole',
                userId: this.currentUser.uid,
                additionalData: { targetUid, newRole }
            });
        }
    }

    /**
     * Get current user
     */
    getCurrentUser(): UserData | null {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    /**
     * Check if current user has specific role
     */
    hasRole(role: 'owner' | 'worker'): boolean {
        return this.currentUser?.role === role;
    }

    /**
     * Subscribe to auth state changes
     */
    subscribeToAuthState(callback: AuthStateListener): () => void {
        this.listeners.add(callback);
        
        // Immediately call with current state
        callback(this.currentUser);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners of auth state changes
     */
    private notifyListeners(user: UserData | null): void {
        this.listeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }

    /**
     * Force refresh user data (useful after role changes)
     */
    async refreshUserData(): Promise<UserData | null> {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            this.currentUser = null;
            this.notifyListeners(null);
            return null;
        }

        try {
            // Force token refresh to get updated custom claims
            await firebaseUser.getIdToken(true);
            const userData = await this.getUserData(firebaseUser);
            this.currentUser = userData;
            this.notifyListeners(userData);
            return userData;
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            return this.currentUser;
        }
    }

    /**
     * Wait for auth initialization
     */
    async waitForAuth(): Promise<UserData | null> {
        return new Promise((resolve) => {
            if (this.initialized && auth.currentUser !== undefined) {
                resolve(this.currentUser);
                return;
            }

            const unsubscribe = this.subscribeToAuthState((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Get user's ID token
     */
    async getIdToken(forceRefresh = false): Promise<string | null> {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return null;

        try {
            return await firebaseUser.getIdToken(forceRefresh);
        } catch (error) {
            console.error('Failed to get ID token:', error);
            return null;
        }
    }

    /**
     * Get user's custom claims
     */
    async getCustomClaims(): Promise<Record<string, any> | null> {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return null;

        try {
            const idTokenResult = await firebaseUser.getIdTokenResult();
            return idTokenResult.claims;
        } catch (error) {
            console.error('Failed to get custom claims:', error);
            return null;
        }
    }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export class for testing
export { AuthService };

// Convenience functions that use the singleton
export const signUp = (name: string, email: string, password: string) => 
    authService.signUp(name, email, password);

export const signIn = (email: string, password: string) => 
    authService.signIn(email, password);

export const signOut = () => 
    authService.signOut();

export const createWorkerAccount = (name: string, email: string, password: string) => 
    authService.createWorkerAccount(name, email, password);

export const setUserRole = (targetUid: string, newRole: 'owner' | 'worker') => 
    authService.setUserRole(targetUid, newRole);

export const getCurrentUser = () => 
    authService.getCurrentUser();

export const isAuthenticated = () => 
    authService.isAuthenticated();

export const hasRole = (role: 'owner' | 'worker') => 
    authService.hasRole(role);

export const subscribeToAuthState = (callback: AuthStateListener) => 
    authService.subscribeToAuthState(callback);

export const refreshUserData = () => 
    authService.refreshUserData();

export const waitForAuth = () => 
    authService.waitForAuth();

export const getIdToken = (forceRefresh?: boolean) => 
    authService.getIdToken(forceRefresh);

export const getCustomClaims = () => 
    authService.getCustomClaims();