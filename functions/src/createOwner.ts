import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createOwnerAccount = functions.https.onCall(async (data, context) => {
    const { uid, name, email } = data;
    
    if (!uid || !name || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Set owner role in custom claims
        await admin.auth().setCustomUserClaims(uid, { role: 'owner' });

        // Create user document with owner role
        await admin.firestore().collection('users').doc(uid).set({
            name,
            email,
            role: 'owner',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating owner account:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create owner account');
    }
});
