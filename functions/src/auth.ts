import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createOwnerAccount = functions.https.onCall(async (data, context) => {
    const { name, email, uid } = data;
    
    if (!uid || !name || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(uid, { role: 'owner' });

        // Create user document
        await admin.firestore().collection('users').doc(uid).set({
            name,
            email,
            role: 'owner',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Failed to create owner account');
    }
});

export const createWorkerAccount = functions.https.onCall(async (data, context) => {
    // Only owners can create worker accounts
    if (!context.auth?.token?.role || context.auth.token.role !== 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Only owners can create worker accounts');
    }

    const { name, email, password } = data;
    
    if (!name || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Create the user account
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });

        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'worker' });

        // Create user document
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            name,
            email,
            role: 'worker',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, uid: userRecord.uid };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Failed to create worker account');
    }
});
