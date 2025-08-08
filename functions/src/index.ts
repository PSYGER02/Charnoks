import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();

interface CreateWorkerRequest {
  name: string;
  email: string;
  password: string;
}

interface UserData {
  uid: string;
  email: string | null;
  role: 'owner' | 'worker';
  displayName: string;
}

// Create worker account (owner only)
export const createWorkerAccount = onCall<CreateWorkerRequest>(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Check if caller is an owner
    const callerDoc = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'owner') {
      throw new HttpsError('permission-denied', 'Only owners can create worker accounts');
    }

    const { name, email, password } = request.data;

    // Validate input
    if (!name || !email || !password) {
      throw new HttpsError('invalid-argument', 'Name, email, and password are required');
    }

    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }

    // Create user account
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // Create user document in Firestore
    await getFirestore().doc(`users/${userRecord.uid}`).set({
      email,
      displayName: name,
      role: 'worker',
      createdAt: new Date(),
      createdBy: request.auth.uid
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'worker' as const,
      displayName: name
    };

  } catch (error: any) {
    console.error('Error creating worker account:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new HttpsError('invalid-argument', 'Password is too weak');
    } else {
      throw new HttpsError('internal', 'Failed to create worker account');
    }
  }
});

// Set user role (owner only)
export const setUserRole = onCall<{userId: string, role: 'owner' | 'worker'}>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Check if caller is an owner
    const callerDoc = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'owner') {
      throw new HttpsError('permission-denied', 'Only owners can change user roles');
    }

    const { userId, role } = request.data;

    // Update user document
    await getFirestore().doc(`users/${userId}`).update({
      role,
      updatedAt: new Date(),
      updatedBy: request.auth.uid
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error setting user role:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to set user role');
  }
});

// Get user data (for authentication)
export const getUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const userDoc = await getFirestore().doc(`users/${request.auth.uid}`).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new HttpsError('not-found', 'User data not found');
    }

    return {
      uid: request.auth.uid,
      email: request.auth.token.email,
      role: userData.role,
      displayName: userData.displayName
    };

  } catch (error: any) {
    console.error('Error getting user data:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to get user data');
  }
});