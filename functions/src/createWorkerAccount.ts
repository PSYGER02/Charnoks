import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createWorkerAccount = functions.https.onCall(async (data, context) => {
    // Check if the caller is authenticated and is an owner
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to create accounts');
    }

    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData || callerData.role !== 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Only owners can create worker accounts');
    }

    const { name, email, password } = data;

    if (!name || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Create the authentication account
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });

        // Create the user document with worker role
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email,
            displayName: name,
            role: 'worker',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: callerUid
        });

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: name,
            role: 'worker'
        };
    } catch (error) {
        console.error('Error creating worker account:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create worker account');
    }
});
