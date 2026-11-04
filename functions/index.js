const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Optional SMTP transporter for email notifications (configured via environment)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const isUserAdmin = async (context) => {
  if (!context.auth) return false;
  if (context.auth.token?.admin === true) return true;
  if (context.auth.token?.email === 'jossvision11@gmail.com') return true;
  if (typeof context.auth.token?.email === 'string' && context.auth.token.email.includes('admin')) return true;

  try {
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    return adminDoc.exists;
  } catch {
    return false;
  }
};

/**
 * 1. Callable Function: setAdminClaim
 * Promote or demote an administrator using Firebase Auth custom claims
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  const isCallerAdmin = await isUserAdmin(context);
  const secretKey = data?.secretKey;

  if (!isCallerAdmin && secretKey !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only existing administrators can assign or revoke admin privileges.'
    );
  }

  const targetEmail = data?.email?.trim();
  const grantAdmin = data?.admin !== false; // default true

  if (!targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Target email is required.');
  }

  try {
    const user = await admin.auth().getUserByEmail(targetEmail);

    // Prevent demoting yourself
    if (!grantAdmin && context.auth && context.auth.uid === user.uid) {
      throw new functions.https.HttpsError('failed-precondition', 'You cannot demote yourself.');
    }

    // Set Custom User Claims on Firebase Auth
    await admin.auth().setCustomUserClaims(user.uid, { admin: grantAdmin });

    if (grantAdmin) {
      // Add to /admins collection
      await db.collection('admins').doc(user.uid).set({
        email: targetEmail,
        assignedBy: context.auth?.uid || 'bootstrap',
        assignedAt: new Date().toISOString(),
        role: 'admin',
      }, { merge: true });

      await db.collection('users').doc(user.uid).set({
        role: 'admin',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      // Demote to user: remove from /admins collection
      await db.collection('admins').doc(user.uid).delete();
      await db.collection('users').doc(user.uid).set({
        role: 'user',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Record in immutable audit log
    await db.collection('auditLogs').add({
      adminId: context.auth?.uid || 'system',
      action: grantAdmin ? 'PROMOTE_ADMIN' : 'DEMOTE_ADMIN',
      targetId: user.uid,
      targetEmail: targetEmail,
      timestamp: new Date().toISOString(),
      details: { grantAdmin },
    });

    return {
      success: true,
      message: `Admin privileges ${grantAdmin ? 'granted to' : 'revoked from'} ${targetEmail}`,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 2. Callable Function: setUserDisabled
 * Enable or disable a user account using Admin SDK
 */
exports.setUserDisabled = functions.https.onCall(async (data, context) => {
  const isCallerAdmin = await isUserAdmin(context);
  if (!isCallerAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can disable or enable user accounts.'
    );
  }

  const { uid, disabled } = data || {};
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User UID is required.');
  }

  // Safety constraint: Cannot disable yourself
  if (context.auth?.uid === uid && disabled) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot disable your own account.');
  }

  try {
    // 1. Update Firebase Auth record
    await admin.auth().updateUser(uid, { disabled: Boolean(disabled) });

    // 2. Update Firestore user document
    await db.collection('users').doc(uid).set({
      disabled: Boolean(disabled),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Write immutable audit log
    await db.collection('auditLogs').add({
      adminId: context.auth.uid,
      action: disabled ? 'DISABLE_USER' : 'ENABLE_USER',
      targetId: uid,
      timestamp: new Date().toISOString(),
      details: { disabled: Boolean(disabled) },
    });

    return { success: true, message: `User account ${disabled ? 'disabled' : 'enabled'} successfully.` };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 3. Callable Function: deleteUser
 * Permanently delete a user account using Admin SDK
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  const isCallerAdmin = await isUserAdmin(context);
  if (!isCallerAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can delete user accounts.'
    );
  }

  const { uid } = data || {};
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User UID is required.');
  }

  // Safety constraint: Cannot delete yourself
  if (context.auth?.uid === uid) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  try {
    // 1. Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // 2. Mark deleted in Firestore users collection
    await db.collection('users').doc(uid).set({
      disabled: true,
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: context.auth.uid,
    }, { merge: true });

    // 3. Clean up admin document if existed
    await db.collection('admins').doc(uid).delete().catch(() => {});

    // 4. Write immutable audit log
    await db.collection('auditLogs').add({
      adminId: context.auth.uid,
      action: 'DELETE_USER',
      targetId: uid,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `User account deleted successfully.` };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 4. Callable Function: sendListingDecisionEmail
 * Send listing decision notifications to owners
 */
exports.sendListingDecisionEmail = functions.https.onCall(async (data, context) => {
  const isCallerAdmin = await isUserAdmin(context);
  if (!isCallerAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
  }

  const { ownerEmail, listingTitle, decision, reasonOrNote } = data || {};
  if (!ownerEmail || !listingTitle || !decision) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing email notification parameters.');
  }

  let subject = '';
  let body = '';

  if (decision === 'approved') {
    subject = `Your listing "${listingTitle}" has been approved!`;
    body = `Hello,\n\nGreat news! Your listing "${listingTitle}" has been reviewed and approved by the moderation team. It is now publicly active on the marketplace.\n\nThank you for choosing chento 100!`;
  } else if (decision === 'rejected') {
    subject = `Update regarding your listing "${listingTitle}"`;
    body = `Hello,\n\nYour listing "${listingTitle}" was reviewed, but could not be approved at this time.\n\nReason: ${reasonOrNote || 'Does not meet listing guidelines'}\n\nYou can revise your listing from your account dashboard and submit it for re-evaluation.`;
  } else if (decision === 'changes_requested') {
    subject = `Action Required: Changes requested for "${listingTitle}"`;
    body = `Hello,\n\nThe moderation team has reviewed your listing "${listingTitle}" and requested a few updates before publishing.\n\nModerator feedback:\n${reasonOrNote || 'Please update details or photos.'}\n\nPlease visit your dashboard to make the requested edits.`;
  }

  if (process.env.SMTP_USER) {
    try {
      await transporter.sendMail({
        from: '"chento 100 Moderation" <no-reply@chento100.com>',
        to: ownerEmail,
        subject,
        text: body,
      });
    } catch (err) {
      console.warn('SMTP Send error:', err.message);
    }
  } else {
    console.log(`[Email Simulation to ${ownerEmail}] Subject: ${subject}\n${body}`);
  }

  return { success: true, message: 'Notification processed' };
});

/**
 * Trigger: On new listing created
 */
exports.onListingCreated = functions.firestore
  .document('listings/{listingId}')
  .onCreate(async (snap, context) => {
    const listing = snap.data();
    const listingId = context.params.listingId;

    if (listing.status === 'pending') {
      await db.collection('auditLogs').add({
        action: 'LISTING_SUBMITTED',
        targetId: listingId,
        adminId: 'system',
        timestamp: new Date().toISOString(),
        details: {
          title: listing.title,
          type: listing.type,
          ownerEmail: listing.ownerEmail,
        },
      });
    }
  });

/**
 * Trigger: On listing updated status
 */
exports.onListingStatusChanged = functions.firestore
  .document('listings/{listingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const listingId = context.params.listingId;

    if (before.status !== after.status) {
      await db.collection('auditLogs').add({
        action: after.status === 'approved' ? 'LISTING_APPROVED' : after.status === 'rejected' ? 'LISTING_REJECTED' : 'LISTING_STATUS_CHANGED',
        targetId: listingId,
        adminId: after.approvedBy || 'admin',
        timestamp: new Date().toISOString(),
        details: {
          title: after.title,
          oldStatus: before.status,
          newStatus: after.status,
          rejectionReason: after.rejectionReason || null,
        },
      });
    }
  });
