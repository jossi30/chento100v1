/**
 * One-time script to promote a user to Administrator in Firebase
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/set-admin.js user@example.com
 */

const admin = require('firebase-admin');

// Initialize with Application Default Credentials or explicit service account
if (!admin.apps.length) {
  admin.initializeApp();
}

async function setAdmin(email) {
  if (!email) {
    console.error('Error: Please provide a user email as an argument.');
    console.log('Example: node scripts/set-admin.js jossvision11@gmail.com');
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);

    // 1. Set Custom Claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Custom user claim { admin: true } set.`);

    // 2. Set Firestore document in /admins/{uid}
    const db = admin.firestore();
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      assignedAt: new Date().toISOString(),
      role: 'admin',
    }, { merge: true });
    console.log(`Added to /admins/${user.uid} in Firestore.`);

    // 3. Update /users/{uid} document
    await db.collection('users').doc(user.uid).set({
      role: 'admin',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Updated role to 'admin' in /users/${user.uid}.`);

    console.log(`SUCCESS: ${email} is now a platform Administrator.`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to assign admin role:`, err.message);
    process.exit(1);
  }
}

const targetEmail = process.argv[2] || 'jossvision11@gmail.com';
setAdmin(targetEmail);
